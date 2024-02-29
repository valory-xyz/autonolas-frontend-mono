export const getChainId = jest.fn(() => 1);
export const getProvider = jest.fn(() => {
  return {
    request: jest.fn(),
  };
});
export const doesNetworkHaveValidServiceManagerTokenFn = jest.fn(() => true);
