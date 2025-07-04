const { resolve } = require('path');
const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('../../tsconfig.base.json');

module.exports = {
  displayName: 'mech',
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
  coverageDirectory: '../../coverage/apps/mech',
  collectCoverageFrom: [
    'common-util/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',

    // styles are not required to be tested
    '!common-util/**/styles.{js,jsx,ts,tsx}',
    '!components/**/styles.{js,jsx,ts,tsx}',
    '!components/GlobalStyles/*.{js,jsx,ts,tsx}',
  ],
};
