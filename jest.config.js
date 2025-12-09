const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  
  // --- TAMBAHKAN BAGIAN INI ---
  moduleNameMapper: {
    // Memberitahu Jest bahwa @/ merujuk ke folder root
    '^@/(.*)$': '<rootDir>/$1',
  }
}

module.exports = createJestConfig(customJestConfig)