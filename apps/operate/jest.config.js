const { resolve } = require('path');
const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('../../tsconfig.base.json');

module.exports = {
  displayName: 'operate',
  preset: '../../jest.preset.js',
  testEnvironment: 'jsdom',

  moduleNameMapper: {
    ...pathsToModuleNameMapper(compilerOptions.paths, { prefix: resolve(__dirname, '../..') }),
    '^util/(.*)$': '<rootDir>/util/$1',
    '^common-util/(.*)$': '<rootDir>/common-util/$1',
    '^components/(.*)$': '<rootDir>/components/$1',
    '^images/(.*)$': '<rootDir>/public/images/$1',
    '^store/(.*)$': '<rootDir>/store/$1',
    '^hooks/(.*)$': '<rootDir>/hooks/$1',
    '^types/(.*)$': '<rootDir>/types/$1',
    '^context/(.*)$': '<rootDir>/context/$1',
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
  },
  globals: { fetch },
};
