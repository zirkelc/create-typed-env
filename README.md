# typesafe-env

A type-safe proxy for accessing environment variables.

## Installation

```bash
npm install typesafe-env
```

## Usage

The `createEnv` function creates a Proxy around `process.env` and throws an error if you try to access an undefined environment variable. The generic type `createEnv<Env>` is used to define the shape of the environment variables which are available. This could be static type or it could be inferred from a schema or imported from a generated file.

```typescript
import { createEnv } from 'typesafe-env';

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
const env = createEnv<Env>();

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
const env = createEnv<Env>({ lazy: true });

/**
 * All environment variables are now getter and setter functions.
 */
const dbUrl = env.DATABASE_URL();
env.PORT('3000');
```

This is useful if you want to pass a reference to an environment variable without actually reading the value because it might not be set yet:

```ts
const env = createEnv<Env>({ lazy: true });

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
const env = createEnv<Env>({
  fallback: 'default_value',
});

/**
 * Fallback values for specific environment variables.
 */
const env = createEnv<Env>({
  fallback: {
    PORT: '3000',
  },
});

/**
 * Fallback values per Node.js environments.
 */
const env = createEnv<Env>({
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

### Logging

Enable logging to see warnings when environment variables are missing. This is useful to catch missing environment variables at runtime.

```typescript
/**
 * Log warnings when environment variables are missing.
 */
const env = createEnv<Env>({
  fallback: 'default_value',
  log: true,
});

/**
 * Log warnings when environment variables are missing per Node.js environments.
 */
const env = createEnv<Env>({
  fallback: 'default_value',
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

### `createEnv<TEnv extends Record<string, any>>(options?: CreateEnvOptions)`

Creates a type-safe environment variable manager.

#### Options

- `lazy?: boolean` - If true, environment variables will be getter and setter functions
- `fallback?: string | Record<string, string> | NodeEnvs<string | Record<string, string>>` - Fallback values for missing environment variables
- `log?: boolean | NodeEnvs<boolean>` - If true, missing environment variables will be logged to the console

## License

MIT
