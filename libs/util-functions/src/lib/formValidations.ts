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
