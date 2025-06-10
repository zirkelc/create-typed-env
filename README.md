# create-typed-env

Create a type-safe proxy for accessing environment variables.

## Installation

```bash
npm install create-typed-env
```

## Usage

The `createTypedEnv` function creates a Proxy around `process.env` or `import.meta.env` and throws an error if you try to access an undefined environment variable. The generic type `createTypedEnv<Env>` is used to define the shape of the environment variables which are available. This could be static type or it could be inferred from a schema or imported from a generated file.

```typescript
import { createTypedEnv } from 'create-typed-env';

/**
 * Define your environment variables. 
 * This type can also be imported from a generated file or inferred from a schema.
 */
type Env = {
  DATABASE_URL: string;
  PORT: string;
};

/**
 * Create a typed environment with properties for each environment variable.
 */
const env = createTypedEnv<Env>();

/**
 * Access environment variables.
 * This will throw an error if the environment variable is not defined at runtime.
 */
const dbUrl = env.DATABASE_URL;
env.PORT = '3000';
```

### Lazy Mode

Lazy mode turns the properties into getter and setter functions.

```typescript
/**
 * Create a typed environment with lazy mode.
 */
const env = createTypedEnv<Env>({ lazy: true });

/**
 * All environment variables are now getter and setter functions.
 */
const dbUrl = env.DATABASE_URL();
env.PORT('3000');
```

This is useful if you want to pass a reference to an environment variable without actually reading the value because it might not be set yet:

```ts
const env = createTypedEnv<Env>({ lazy: true });

class Database {
  dbUrl: () => string;
  client: Client | undefined;

  constructor(dbUrl: () => string) {
    this.dbUrl = dbUrl;
  }

  async query(sql: string) {
    if (!this.client) {
      this.client = new Client(this.dbUrl());
    }

    return this.client.query(sql);
  }
}

/**
 * Pass a lazy environment variable reference to the constructor.
 * The environment variable is not set yet.
 */
const db = new Database(env.DATABASE_URL);

/**
 * Set the environment variable at runtime.
 */
env.DATABASE_URL('new_db_url');

/**
 * This will access the environment variable lazily and connect to the database.
 */
await db.query('SELECT * FROM users');
```

### Fallback Values

You can provide fallback values for missing environment variables. This is useful in test environments when a missing environment variable is not a problem.

```typescript
/**
 * Single fallback value for all missing environment variables.
 */
const env = createTypedEnv<Env>({
  fallback: 'fallback_value',
});

/**
 * Fallback values for specific environment variables.
 */
const env = createTypedEnv<Env>({
  fallback: {
    PORT: '3000',
  },
});

/**
 * Fallback values per Node.js environments.
 */
const env = createTypedEnv<Env>({
  fallback: {
    env: {
      development: 'dev_fallback',
      test: 'test_fallback',
      production: 'prod_fallback',
    },
  },
});

/**
 * Fallback values per Node.js environments.
 */
const env = createTypedEnv<Env>({
  fallback: {
    env: {
      development: {
        DATABASE_URL: 'dev_db_url',
        PORT: '3000',
      },
      test: {
        DATABASE_URL: 'test_db_url',
        PORT: '3000',
      },
      production: {
        DATABASE_URL: 'prod_db_url',
        PORT: '3000',
      },
    },
  },
});
```

### Environment Variables

You can pass a custom environment variable object to the `createEnv` function. This is useful if you work in a non-Node.js environment like the browser.

```typescript
const env = createTypedEnv<Env>({ env: import.meta.env });
```

### Logging

Enable logging to see warnings when environment variables are missing. This is useful to catch missing environment variables at runtime.

```typescript
/**
 * Log warnings when environment variables are missing.
 */
const env = createTypedEnv<Env>({
  fallback: 'fallback_value',
  log: true,
});

/**
 * Log warnings when environment variables are missing per Node.js environments.
 */
const env = createTypedEnv<Env>({
  fallback: 'fallback_value',
  log: {
    env: { 
      development: true, 
      test: true, 
      production: true 
    },
  },
});

/**
 * This will return the fallback value because the environment variable is not set, and it will be logged to the console.
 */
const dbUrl = env.DATABASE_URL;
```

## API Reference

### `createTypedEnv<TEnv extends Record<string, any>>(options?: CreateEnvOptions)`

Creates a type-safe environment variable manager.

#### Options

- `env?: Record<string, string>` - Environment variable object, defaults to `process.env`
- `lazy?: boolean` - If true, environment variables will be getter and setter functions
- `fallback?: string | Record<string, string> | NodeEnvs<string | Record<string, string>>` - Fallback values for missing environment variables
- `log?: boolean | NodeEnvs<boolean>` - If true, missing environment variables will be logged to the console

## License

MIT
