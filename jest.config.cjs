module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    "**/__tests__/**/*.test.ts",
    "**/__tests__/**/*.spec.ts"
  ],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      babelConfig: {
        plugins: [
          ['@babel/plugin-proposal-decorators', { legacy: true }]
        ]
      }
    }]
  }
}; 