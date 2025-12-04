module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(d3|d3-array|d3-collection|internmap|delaunator|robust-predicates)/)',
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
  ],
  coverageDirectory: 'coverage',
  testMatch: [
    '**/tests/**/*.test.js',
  ],
};

