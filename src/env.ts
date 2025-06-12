/**
 * Fallback value for missing environment variables.
 * Supports string, object and environment-specific fallback values.
 */
type FallbackValue =
  | string
  | Record<string, string>
  | ((key: string) => string);

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
  | FallbackValue
  | {
      env: NodeEnvs<FallbackValue>;
    };

type Log = boolean | NodeEnvs<boolean>;

/**
 * Options for creating an environment variable proxy.
 */
type CreateEnvOptions<TLazy extends boolean> = {
  /**
   * The source of environment variables.
   * Defaults to `process.env`.
   */
  env?: NodeJS.ProcessEnv | Record<string, string>;
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
export function createTypedEnv<TEnv extends Record<string, any>>(
  options?: CreateEnvOptions<false>,
): TypedEnv<TEnv, false>;
export function createTypedEnv<TEnv extends Record<string, any>>(
  options: CreateEnvOptions<true>,
): TypedEnv<TEnv, true>;

/**
 * Creates a type-safe proxy for accessing environment variables.
 */
export function createTypedEnv(options?: CreateEnvOptions<boolean>) {
  // TODO: add zod schema for validation of process.env values and infer types

  const { lazy, fallback, log, env = process.env } = options ?? {};

  const logger = (message: string) => {
    const nodeEnv = env?.NODE_ENV;

    if (!log) return;
    if (typeof log === 'boolean') {
      console.warn(message);
    } else if (
      typeof log === 'object' &&
      nodeEnv &&
      nodeEnv in log &&
      log[nodeEnv as keyof typeof log]
    ) {
      console.warn(message);
    }
  };

  const getFallbackValue = (fallback: Fallback | undefined, key: string) => {
    if (typeof fallback === 'string') return fallback;

    if (typeof fallback === 'function') return fallback(key);

    if (typeof fallback === 'object') {
      if ('env' in fallback && typeof fallback.env === 'object') {
        const fallbackEnv =
          fallback.env[process.env.NODE_ENV as keyof typeof fallback.env];

        return getFallbackValue(fallbackEnv, key);
      }

      if (key in fallback) {
        const fallbackValue = fallback[key as keyof typeof fallback] as Record<
          string,
          string
        >;
        return getFallbackValue(fallbackValue, key);
      }
    }

    throw new Error(`Invalid fallback value: ${fallback}`);
  };

  const getEnvValue = (key: string): string => {
    if (key in env) return env[key]!;

    if (!fallback) {
      logger(`Environment variable ${key} not found`);
      throw new Error(`Environment variable ${key} not found`);
    }

    const fallbackValue = getFallbackValue(fallback, key);
    if (fallbackValue) {
      logger(
        `Environment variable ${key} not found, using fallback: ${fallbackValue}`,
      );
      return fallbackValue;
    }

    logger(`Invalid fallback value for environment variable ${key}`);
    throw new Error(`Invalid fallback value for environment variable ${key}`);
  };

  const setEnvValue = (key: string, value: string) => {
    env[key] = value;
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
