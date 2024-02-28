// import { resolve } from 'path';
// import { pathsToModuleNameMapper } from 'ts-jest/utils';
const { resolve } = require('path');
const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('../../tsconfig.base.json');

const esModules = ['wagmi'].join('|');

module.exports = {
  displayName: 'autonolas-registry',
  preset: '../../jest.preset.js',
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.spec.json',
      useESM: true,
    },
  },
  testEnvironment: 'jsdom',
  moduleDirectories: ['node_modules'],
  moduleNameMapper: {
    ...pathsToModuleNameMapper(compilerOptions.paths, { prefix: resolve(__dirname, '../..') }),
  },
  setupFilesAfterEnv: ['./jest.setup.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['ts-jest', { presets: ['@nx/next/babel'] }],
  },
  transformIgnorePatterns: [`/node_modules/(?!${esModules})`],

  // transformIgnorePatterns: [
  //   'node_modules/(?!(wagmi)/)',
  // ],
  coverageDirectory: '../../coverage/apps/autonolas-registry',
  // verbose: true,
  // collectCoverageFrom: [
  //   'common-util/**/*.{js,jsx}',
  //   'components/**/*.{js,jsx}',

  //   // ABI will change frequently on backend deployment hence avoiding.
  //   '!common-util/AbiAndAddresses/*.{js,jsx}',

  //   // Contract objects
  //   '!common-util/Contracts/*.{js,jsx}',

  //   // styles are not required to be tested
  //   '!common-util/**/styles.{js,jsx}',
  //   '!components/**/styles.{js,jsx}',
  //   '!components/GlobalStyles/*.{js,jsx}',

  //   // Index page
  //   '!components/index/.jsx',
  // ],
  // setupFilesAfterEnv: ['./jest.setup.js'],
  // transformIgnorePatterns: [
  //   'node_modules/(?!(react-native|my-project|react-native-button)/)',
  // ],
  // moduleNameMapper: {
  //   '\\.(css|less|sass|scss)$': '<rootDir>/__mocks__/styleMock.js',
  //   '\\.(gif|ttf|eot|svg)$': '<rootDir>/__mocks__/fileMock.js',
  // },
  // testEnvironment: 'jsdom',
};
