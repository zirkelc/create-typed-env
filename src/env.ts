/**
 * Fallback values for environment variables per Node.js environment.
 */
type NodeEnvs<TValue> = {
  development?: TValue;
  test?: TValue;
  production?: TValue;
};

/**
 * Fallback value for missing environment variables.
 * Supports string, object and environment-specific fallback values.
 */
type Fallback =
  | string
  | Record<string, string>
  | {
      env: NodeEnvs<string | Record<string, string>>;
    };

type Log = boolean | NodeEnvs<boolean>;

/**
 * Options for creating an environment variable proxy.
 */
type CreateEnvOptions<TLazy extends boolean> = {
  /**
   * If true, the environment variable will be getter and setter functions.
   * Otherwise, the environment variable will be a direct property.
   */
  lazy?: TLazy;
  /**
   * Fallback value for missing environment variables.
   */
  fallback?: Fallback;
  /**
   * If true, missing environment variables will be logged to the console.
   */
  log?: Log;
};

// TODO use readonly: boolean and set keys to readonly if true
type TypedEnv<
  TEnv extends Record<string, any>,
  TLazy extends boolean,
> = TLazy extends true
  ? {
      -readonly [K in keyof TEnv]: (value?: string) => string;
    }
  : {
      -readonly [K in keyof TEnv]: string;
    };
/**
 * Creates a type-safe proxy for accessing environment variables.
 */
export function createEnv<TEnv extends Record<string, any>>(
  options?: CreateEnvOptions<false>,
): TypedEnv<TEnv, false>;
export function createEnv<TEnv extends Record<string, any>>(
  options: CreateEnvOptions<true>,
): TypedEnv<TEnv, true>;

/**
 * Creates a type-safe proxy for accessing environment variables.
 */
export function createEnv(options?: CreateEnvOptions<boolean>) {
  // TODO: add zod schema for validation of process.env values and infer types

  const { lazy, fallback, log } = options ?? {};

  const logger = (message: string) => {
    if (!log) return;
    if (typeof log === 'boolean') {
      console.warn(message);
    } else if (
      typeof log === 'object' &&
      process.env.NODE_ENV in log &&
      log[process.env.NODE_ENV]
    ) {
      console.warn(message);
    }
  };

  const getEnvValue = (key: string): string => {
    if (!(key in process.env)) {
      if (fallback) {
        if (typeof fallback === 'string') {
          logger(
            `Environment variable ${key} not found, using fallback '${fallback}'`,
          );
          return fallback;
        }

        if (typeof fallback === 'object') {
          const env =
            'env' in fallback && typeof fallback.env === 'object'
              ? fallback.env[process.env.NODE_ENV as keyof typeof fallback.env]
              : fallback;

          if (typeof env === 'string') {
            logger(
              `Environment variable ${key} not found, using fallback '${env}'`,
            );
            return env;
          }

          if (key in env) {
            logger(
              `Environment variable ${key} not found, using fallback '${env[key]}'`,
            );
            return env[key];
          }
        }
      }

      logger(`Environment variable ${key} not found`);
      throw new Error(`Environment variable ${key} not found`);
    }

    return process.env[key]!;
  };

  const setEnvValue = (key: string, value: string) => {
    process.env[key] = value;
  };

  return new Proxy({} as any, {
    get(target, prop: string) {
      if (lazy) {
        return (value?: string) => {
          if (value !== undefined) {
            setEnvValue(prop, value);
          }
          return getEnvValue(prop);
        };
      }

      return getEnvValue(prop);
    },
    set(target, prop: string, value: any) {
      if (!lazy) {
        // Only allow setting via assignment if not lazy
        if (typeof value !== 'string') {
          throw new Error(
            `Environment variables must be strings. Attempted to set ${prop} to non-string.`,
          );
        }
        setEnvValue(prop, value);
        return true;
      }

      throw new Error(
        `Attempted to set lazy environment variable ${prop} via assignment. Use the function call env.${prop}('value') instead.`,
      );
    },
  });
}
