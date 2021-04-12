module.exports = {
  clearMocks: true,
  collectCoverage: true,
  moduleFileExtensions: ['js', 'ts'],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  testRunner: 'jest-circus/runner',
  coverageDirectory: "<rootDir>/coverage/",
  coverageReporters: ['text-summary', 'html'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  verbose: true
}