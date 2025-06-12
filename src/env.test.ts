import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createTypedEnv } from './env.js';

// Arrange
beforeEach(() => {
  process.env.TEST_VAR = 'test_value';
  process.env.NODE_ENV = 'development';
});

afterEach(() => {
  // Clean up environment variables by setting them to undefined
  process.env.TEST_VAR = undefined;
  process.env.NODE_ENV = undefined;
});

describe('createTypedEnv', () => {
  describe('eager mode', () => {
    test('should get value', () => {
      // Arrange
      const env = createTypedEnv<{ TEST_VAR: string }>();

      // Act
      const value = env.TEST_VAR;

      // Assert
      expect(value).toBe('test_value');
    });

    test('should set value', () => {
      // Arrange
      const env = createTypedEnv<{ NEW_VAR: string }>();

      // Act
      env.NEW_VAR = 'new_value';

      // Assert
      expect(env.NEW_VAR).toBe('new_value');
      expect(process.env.NEW_VAR).toBe('new_value');
    });

    test('should throw error when variable is not found', () => {
      // Arrange
      const env = createTypedEnv<{ MISSING_VAR: string }>();

      // Act
      const result = () => env.MISSING_VAR;

      // Assert
      expect(result).toThrow();
    });

    test('should throw error when setting non-string value in eager mode', () => {
      // Arrange
      const env = createTypedEnv<{ NEW_VAR: string }>();

      // Act
      const result = () => {
        // @ts-expect-error Testing invalid type
        env.NEW_VAR = 123;
      };

      // Assert
      expect(result).toThrow();
    });
  });

  describe('lazy mode', () => {
    test('should get value', () => {
      // Arrange
      const env = createTypedEnv<{ TEST_VAR: string }>({ lazy: true });

      // Act
      const value = env.TEST_VAR();

      // Assert
      expect(value).toBe('test_value');
    });

    test('should set value', () => {
      // Arrange
      const env = createTypedEnv<{ NEW_VAR: string }>({ lazy: true });

      // Act
      env.NEW_VAR('new_value');

      // Assert
      expect(env.NEW_VAR()).toBe('new_value');
      expect(process.env.NEW_VAR).toBe('new_value');
    });

    test('should throw error when variable is not found', () => {
      // Arrange
      const env = createTypedEnv<{ MISSING_VAR: string }>({ lazy: true });

      // Act
      const result = () => env.MISSING_VAR();

      // Assert
      expect(result).toThrow();
    });

    test('should throw error when setting value via assignment in lazy mode', () => {
      // Arrange
      const env = createTypedEnv<{ NEW_VAR: string }>({ lazy: true });

      // Act
      const result = () => {
        // @ts-expect-error Testing invalid assignment
        env.NEW_VAR = 'new_value';
      };

      // Assert
      expect(result).toThrow();
    });
  });

  describe('env', () => {
    test('should use process.env if no env option is provided', () => {
      // Arrange
      const env = createTypedEnv<{ TEST_VAR: string }>();

      // Act
      const value = env.TEST_VAR;

      // Assert
      expect(value).toBe('test_value');
    });

    test('should use env option if provided', () => {
      // Arrange
      const env = createTypedEnv<{ TEST_VAR: string }>({
        env: { TEST_VAR: 'env_value' },
      });

      // Act
      const value = env.TEST_VAR;

      // Assert
      expect(value).toBe('env_value');
    });
  });

  describe('fallback', () => {
    test('should use string fallback', () => {
      // Arrange
      const env = createTypedEnv<{ MISSING_VAR: string }>({
        fallback: 'fallback_value',
      });

      // Act
      const value = env.MISSING_VAR;

      // Assert
      expect(value).toBe('fallback_value');
    });

    test('should use object fallback', () => {
      // Arrange
      const env = createTypedEnv<{ MISSING_VAR: string }>({
        fallback: {
          MISSING_VAR: 'object_fallback',
        },
      });

      // Act
      const value = env.MISSING_VAR;

      // Assert
      expect(value).toBe('object_fallback');
    });

    test('should use function fallback', () => {
      // Arrange
      const env = createTypedEnv<{ MISSING_VAR: string }>({
        fallback: (key) => `${key}_fallback`,
      });

      // Act
      const value = env.MISSING_VAR;

      // Assert
      expect(value).toBe('MISSING_VAR_fallback');
    });

    test('should use environment-specific string fallback', () => {
      // Arrange
      const env = createTypedEnv<{ MISSING_VAR: string }>({
        fallback: {
          env: {
            development: 'dev_fallback',
            test: 'test_fallback',
            production: 'prod_fallback',
          },
        },
      });

      // Act
      const value = env.MISSING_VAR;

      // Assert
      expect(value).toBe('dev_fallback');
    });

    test('should use environment-specific object fallback', () => {
      // Arrange
      const env = createTypedEnv<{ MISSING_VAR: string }>({
        fallback: {
          env: {
            development: {
              MISSING_VAR: 'dev_fallback',
            },
            test: {
              MISSING_VAR: 'test_fallback',
            },
            production: {
              MISSING_VAR: 'prod_fallback',
            },
          },
        },
      });

      // Act
      const value = env.MISSING_VAR;

      // Assert
      expect(value).toBe('dev_fallback');
    });

    test('should use environment-specific function fallback', () => {
      // Arrange
      const env = createTypedEnv<{ MISSING_VAR: string }>({
        fallback: {
          env: {
            development: (key) => `${key}_dev_fallback`,
            test: (key) => `${key}_test_fallback`,
            production: (key) => `${key}_prod_fallback`,
          },
        },
      });

      // Act
      const value = env.MISSING_VAR;

      // Assert
      expect(value).toBe('MISSING_VAR_dev_fallback');
    });
  });

  describe('log', () => {
    test('should log when log option is enabled', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const env = createTypedEnv<{ MISSING_VAR: string }>({
        fallback: 'fallback_value',
        log: true,
      });

      // Act
      env.MISSING_VAR;

      // Assert
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should not log when log option is disabled', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const env = createTypedEnv<{ MISSING_VAR: string }>({
        fallback: 'fallback_value',
        log: false,
      });

      // Act
      env.MISSING_VAR;

      // Assert
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should log when environment is enabled', () => {
      // Arrange
      process.env.NODE_ENV = 'development';
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const env = createTypedEnv<{ MISSING_VAR: string }>({
        fallback: 'fallback_value',
        log: {
          development: true,
          test: false,
          production: false,
        },
      });

      // Act
      env.MISSING_VAR;

      // Assert
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should not log in test environment when disabled', () => {
      // Arrange
      process.env.NODE_ENV = 'development';
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const env = createTypedEnv<{ MISSING_VAR: string }>({
        fallback: 'fallback_value',
        log: {
          development: false,
          test: false,
          production: false,
        },
      });

      // Act
      env.MISSING_VAR;

      // Assert
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
