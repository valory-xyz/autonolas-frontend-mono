import isNil from 'lodash/isNil';

import { HASH_PREFIXES } from 'util/constants';

export const getBase16Validator = (value, hashType = HASH_PREFIXES.type1) => {
  if (isNil(value) || value === '') {
    return Promise.resolve();
  }

  if (hashType === HASH_PREFIXES.type1) {
    // only 64 characters long valid Hash
    if (value.length === 64 && /[0-9a-f]/gm.test(value)) {
      return Promise.resolve();
    }
  }

  if (hashType === HASH_PREFIXES.type2) {
    if (value.length === 52 && /[0-9a-z]/gm.test(value)) {
      return Promise.resolve();
    }
  }

  return Promise.reject(new Error('Please input a valid hash'));
};
