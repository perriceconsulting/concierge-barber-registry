// eslint-disable-next-line @typescript-eslint/no-require-imports
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Settings shared by every project.
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
};

// Coverage is scoped to the code these suites actually exercise. Pointing it at
// all of `src` measured API routes, React pages and templates that only the
// Playwright suite touches, which made the number meaningless and the threshold
// unreachable. Thresholds below are a ratchet set just under current measured
// coverage: raise them as coverage grows, never lower them to make a build pass.
const coverageConfig = {
  collectCoverageFrom: [
    'src/lib/**/*.{js,jsx,ts,tsx}',
    'src/hooks/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
  coverageReporters: ['text', 'lcov', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 20,
      functions: 20,
      lines: 25,
      statements: 25,
    },
  },
};

const jestConfig = async () => {
  const nextConfig = await createJestConfig(customJestConfig)();

  const shared = {
    ...nextConfig,
    transformIgnorePatterns: [
      '/node_modules/(?!(geist)/)',
      '^.+\\.module\\.(css|sass|scss)$',
    ],
  };

  return {
    ...coverageConfig,
    projects: [
      {
        // Components and pure modules: need a DOM.
        ...shared,
        displayName: 'unit',
        testEnvironment: 'jest-environment-jsdom',
        testMatch: ['**/__tests__/unit/**/*.(test|spec).[jt]s?(x)'],
      },
      {
        // Route handlers and middleware: need real Web Fetch globals
        // (Request/Response/Headers). jsdom doesn't provide them, which is why
        // every one of these suites failed to even load under the old config.
        ...shared,
        displayName: 'integration',
        testEnvironment: 'node',
        testMatch: ['**/__tests__/integration/**/*.(test|spec).[jt]s?(x)'],
      },
    ],
  };
};

module.exports = jestConfig;
