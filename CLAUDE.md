# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is `create-typed-env`, a TypeScript library that creates a type-safe proxy for accessing environment variables. The library supports both eager and lazy access modes, fallback values, environment-specific configurations, and logging capabilities.

## Development Commands

### Package Manager
- Uses `pnpm` as the package manager (specified in package.json)
- Install dependencies: `pnpm install`

### Build and Development
- **Build**: `pnpm build` - Uses `unbuild` to generate CommonJS and ESM distributions
- **Test**: `pnpm test` - Runs tests using Vitest
- **Lint**: `pnpm lint` - Uses Biome for linting and formatting with `--write` flag
- **Type Check**: `pnpm typecheck` - Uses `attw --pack .` (Are The Types Wrong) for package type validation
- **Pre-publish**: `pnpm prepublishOnly` - Runs build and typecheck before publishing

### Git Hooks
- Pre-commit hook runs Biome formatting/linting on staged files
- Located in `.husky/pre-commit`

## Architecture

### Core Files
- **`src/index.ts`**: Main export file that re-exports from `env.js`
- **`src/env.ts`**: Contains the main `createTypedEnv` function and all type definitions

### Key Components

#### Main Function
- `createTypedEnv<TEnv>()`: Creates a Proxy-based type-safe environment variable accessor
- Supports function overloads for lazy vs eager modes
- Returns `TypedEnv<TEnv, TLazy>` type

#### Core Features
1. **Eager Mode (default)**: Direct property access (`env.DATABASE_URL`)
2. **Lazy Mode**: Function-based access (`env.DATABASE_URL()`)
3. **Fallback System**: String, object, function, or environment-specific fallbacks
4. **Logging**: Optional console warnings for missing variables
5. **Custom Environment**: Can use custom env object instead of `process.env`

#### Type System
- `CreateEnvOptions<TLazy>`: Configuration options with lazy mode flag
- `TypedEnv<TEnv, TLazy>`: Conditional return type based on lazy mode
- `FallbackValue`, `NodeEnvs<T>`, `Fallback`, `Log`: Supporting types for configuration

### Testing
- Uses Vitest for testing
- Comprehensive test coverage in `src/env.test.ts`
- Tests cover eager/lazy modes, fallbacks, logging, and error cases
- Uses `beforeEach`/`afterEach` for environment variable cleanup

### Configuration Files
- **TypeScript**: Extends `@total-typescript/tsconfig/tsc/no-dom/library`
- **Biome**: Configured for formatting (single quotes, semicolons, trailing commas) and linting
- **Vitest**: Minimal configuration in `vitest.config.ts`
- **Build**: Uses `unbuild` (no explicit config file, uses package.json configuration)

### Output Structure
- Builds to `dist/` directory with:
  - `index.cjs` (CommonJS)
  - `index.mjs` (ESM) 
  - `index.d.ts` (TypeScript declarations)

## Development Workflow

1. Make changes to `src/env.ts` (main implementation) or `src/env.test.ts` (tests)
2. Run `pnpm test` to verify functionality
3. Run `pnpm lint` to format and lint code
4. Run `pnpm build && pnpm typecheck` to verify package integrity
5. Git hooks will automatically run Biome on commit