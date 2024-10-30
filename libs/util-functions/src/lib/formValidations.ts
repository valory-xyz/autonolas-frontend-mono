import { Rule } from 'antd/es/form';
import { isNil } from 'lodash';

import { isValidAddress } from './ethers';

export const FORM_VALIDATION: {
  validateCommaSeparatedList: Rule;
  validateAddress: Rule;
} = {
  validateCommaSeparatedList: {
    validator(_, value) {
      // even empty value is accepted as it is not required
      if (isNil(value) || value === '') {
        return Promise.resolve();
      }

      /**
       * https://regex101.com/r/ip1z51/1
       * accepts comma separated values, examples below
       * eg
       * 1,2,4,2
       * 2,3,4
       * 4,   2,4,5
       * 2,3     ,4
       * 7
       */
      if (/^\d+(\s*,\s*\d+?)*$/gm.test(value)) {
        return Promise.resolve();
      }
      return Promise.reject(new Error('Please input a valid list of numbers separated by commas.'));
    },
  },
  validateAddress: {
    validator(_, value) {
      if (isValidAddress(value)) return Promise.resolve();
      return Promise.reject(new Error('Please input a valid address'));
    },
  },
};

export const allowOnlyNumbers = (e: React.KeyboardEvent<HTMLInputElement>) => {
  const isCopy = (e.ctrlKey || e.metaKey) && e.key === 'c';
  const isPaste = (e.ctrlKey || e.metaKey) && e.key === 'v';
  const isCut = (e.ctrlKey || e.metaKey) && e.key === 'x';
  const isSelectAll = (e.ctrlKey || e.metaKey) && e.key === 'a';

  if (
    !/[0-9]/.test(e.key) &&
    e.key !== 'Backspace' &&
    e.key !== 'Delete' &&
    e.key !== 'ArrowLeft' &&
    e.key !== 'ArrowRight' &&
    e.key !== 'Tab' &&
    e.key !== 'Control' &&
    e.key !== '.' &&
    !isCopy &&
    !isPaste &&
    !isCut &&
    !isSelectAll
  ) {
    e.preventDefault();
  }

  // Prevent more than one decimal point
  const value = e.currentTarget.value;
  if (e.key === '.' && value.includes('.')) {
    e.preventDefault();
  }
};
