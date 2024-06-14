const { resolve } = require('path');
const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('../../tsconfig.base.json');

module.exports = {
  displayName: 'launch',
  preset: '../../jest.preset.js',
  testEnvironment: 'jsdom',
  moduleDirectories: ['node_modules'],
  testTimeout: 10000,
  moduleNameMapper: {
    ...pathsToModuleNameMapper(compilerOptions.paths, { prefix: resolve(__dirname, '../..') }),
    '^util/(.*)$': '<rootDir>/util/$1',
    '^common-util/(.*)$': '<rootDir>/common-util/$1',
    '^components/(.*)$': '<rootDir>/components/$1',
    '^images/(.*)$': '<rootDir>/public/images/$1',
    '^store/(.*)$': '<rootDir>/store/$1',
    '^hooks/(.*)$': '<rootDir>/hooks/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        presets: ['@nx/next/babel'],
        tsconfig: '<rootDir>/tsconfig.spec.json',
        useESM: true,
      },
    ],
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
  },
  globals: { fetch },
  coverageDirectory: '../../coverage/apps/launch',
  collectCoverageFrom: [
    'common-util/**/*.{js,jsx}',
    'components/**/*.{js,jsx}',

    // ABI will change frequently on backend deployment hence avoiding.
    '!common-util/AbiAndAddresses/*.{js,jsx}',

    // Contract objects
    '!common-util/Contracts/*.{js,jsx}',

    // styles are not required to be tested
    '!common-util/**/styles.{js,jsx}',
    '!components/**/styles.{js,jsx}',
    '!components/GlobalStyles/*.{js,jsx}',

    // Index page
    '!components/index/.jsx',
  ],
};
