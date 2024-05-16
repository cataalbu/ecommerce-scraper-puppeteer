import type { Config } from 'jest';

const config: Config = {
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { useESM: true }],
  },
  moduleNameMapper: {
    '(.+)\\.js': '$1',
  },
  extensionsToTreatAsEsm: ['.ts'],
  rootDir: 'src',
  coverageDirectory: '../coverage',
};

export default config;
