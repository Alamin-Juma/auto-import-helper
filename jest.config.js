// jest.config.js
module.exports = {
    testEnvironment: 'node',
    collectCoverage: true,
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
      'index.js',
      'scripts/**/*.js',
      '!**/node_modules/**',
      '!**/examples/**',
    ],
    testMatch: [
      '**/__tests__/**/*.js',
      '**/?(*.)+(spec|test).js'
    ],
    verbose: true
  };
  