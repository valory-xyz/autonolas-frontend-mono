import { normalizeToolSchema } from 'common-util/functions/erc8004Helpers';

jest.mock('common-util/Login/config', () => ({
  EVM_SUPPORTED_CHAINS: [],
  SVM_SUPPORTED_CHAINS: [],
  SUPPORTED_CHAINS: [],
  wagmiConfig: {},
}));

describe('normalizeToolSchema', () => {
  it('maps type "text" to "string" and keeps the description', () => {
    expect(normalizeToolSchema({ type: 'text', description: 'The question.' })).toEqual({
      type: 'string',
      description: 'The question.',
    });
  });

  it('leaves other types unchanged', () => {
    expect(normalizeToolSchema({ type: 'object', description: 'A payload.' })).toEqual({
      type: 'object',
      description: 'A payload.',
    });
  });

  it('spreads a nested schema wrapper to the top level and drops the wrapper', () => {
    const normalized = normalizeToolSchema({
      type: 'text',
      description: 'Outer.',
      schema: { type: 'object', properties: { prompt: { type: 'string' } } },
    });

    expect(normalized).toEqual({
      type: 'object',
      description: 'Outer.',
      properties: { prompt: { type: 'string' } },
    });
    expect(normalized).not.toHaveProperty('schema');
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['a string', 'text'],
    ['a number', 1],
  ])('returns null instead of throwing when the schema is %s', (_label, raw) => {
    expect(normalizeToolSchema(raw as never)).toBeNull();
  });
});
