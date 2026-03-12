import { render } from '@testing-library/react';

import { useHelpers } from 'common-util/hooks';
import {
  convertStringToArray,
  ListEmptyMessage,
  AlertSuccess,
  AlertError,
} from 'common-util/List/ListCommon';

jest.mock('common-util/hooks', () => ({
  useHelpers: jest.fn(() => ({
    isMainnet: true,
  })),
  useSvmConnectivity: jest.fn(),
}));

describe('convertStringToArray()', () => {
  it.each([
    { input: 'A, B, C', output: ['A', 'B', 'C'] },
    { input: '1, 2', output: ['1', '2'] },
    { input: 'Hello', output: ['Hello'] },
    { input: null, output: null },
    { input: undefined, output: undefined },
  ])('expects valid string (input=$input)', ({ input, output }) => {
    const result = convertStringToArray(input);
    expect(result).toStrictEqual(output);
  });
});

describe('<ListEmptyMessage />', () => {
  it.each([
    { input: 'agent', output: /No agents registered/ },
    { input: 'component', output: /No components registered/ },
    { input: 'service', output: /No services registered/ },
    { input: 'operator', output: /No operators registered/ },
    { input: null, output: /Please check type!/ },
  ])('expects valid type (input=$input)', ({ input, output }) => {
    const { getByText } = render(<ListEmptyMessage type={input} />);
    expect(getByText(output)).toBeInTheDocument();
  });
});

describe('<AlertSuccess />', () => {
  describe('mainnet', () => {
    beforeEach(() => {
      jest.clearAllMocks();

      useHelpers.mockReturnValue({ isMainnet: true });
    });
    it.each([
      {
        type: 'Agent',
        input: { name: 'Valory' },
        output: /Agent minted. This is being indexed and will take a few minutes to show./,
      },
      {
        type: null,
        input: { name: 'Valory' },
        output: /Minted successfully. This is being indexed and will take a few minutes to show./,
      },
    ])('expects valid object (input=$input)', ({ type, input, output }) => {
      const { getByText } = render(<AlertSuccess type={type} information={input} />);
      expect(getByText(output)).toBeInTheDocument();
    });
  });

  describe('non-mainnet', () => {
    beforeEach(() => {
      jest.clearAllMocks();

      useHelpers.mockReturnValue({ isMainnet: false });
    });
    it.each([
      {
        type: 'Agent',
        input: { name: 'Valory' },
        output: /Agent minted./,
      },
      {
        type: null,
        input: { name: 'Valory' },
        output: /Minted successfully./,
      },
    ])('expects valid object (input=$input)', ({ type, input, output }) => {
      const { getByText } = render(<AlertSuccess type={type} information={input} />);
      expect(getByText(output)).toBeInTheDocument();
    });
  });

  it.each([{ input: null }, { input: undefined }])(
    'expects invalid object (input=$input)',
    ({ input }) => {
      const { queryByTestId } = render(<AlertSuccess information={input} />);
      expect(queryByTestId('alert-info-container')).not.toBeInTheDocument();
    },
  );
});

describe('<AlertError />', () => {
  it.each([{ input: new Error('Exception occurred'), output: /Exception occurred/ }])(
    'expects valid error object (input=$input)',
    ({ input, output }) => {
      const { getByText, getByTestId } = render(<AlertError error={input} />);
      expect(getByText(output)).toBeInTheDocument();
      expect(getByTestId('alert-error-container')).toBeInTheDocument();
    },
  );

  it.each([{ input: null }, { input: undefined }])(
    'expects invalid object (input=$input)',
    ({ input }) => {
      const { queryByTestId } = render(<AlertError error={input} />);
      expect(queryByTestId('alert-error-container')).not.toBeInTheDocument();
    },
  );
});
