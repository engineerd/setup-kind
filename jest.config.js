module.exports = {
  clearMocks: true,
  collectCoverage: true,
  coverageReporters: ['lcov', 'text'],
  moduleFileExtensions: ['js', 'ts'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  verbose: true,
};
