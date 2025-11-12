module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['**/__tests__/**/*.test.ts'],
    moduleFileExtensions: ['ts', 'js', 'json'],
    collectCoverageFrom: ['src/**/*.ts', '!src/**/*.test.ts', '!src/**/__tests__/**'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    // Ignore dist folder to prevent old compiled files from interfering
    modulePathIgnorePatterns: ['<rootDir>/dist/'],
    // Transform uuid to CommonJS for Jest
    transformIgnorePatterns: ['node_modules/(?!uuid/)'],
    transform: {
        '^.+\\.ts$': 'ts-jest',
        '^.+\\.m?js$': 'babel-jest',
    },
    // Run tests serially to avoid database conflicts within each shard
    // When running with --shard, each shard gets its own database in CI
    maxWorkers: 1,
    // Setup files to run before tests
    setupFilesAfterEnv: ['<rootDir>/src/__tests__/jest.setup.ts'],
}
