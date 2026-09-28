import { FUNDING_REQUEST_NAME_MAX_LENGTH, FUNDING_REQUEST_SHEET_COLUMNS } from '../constants';
import {
  mapFundingRequestToSheetRow,
  parseFundingRequestSubmission,
  parsePendingFundingRequestRecord,
} from './fundingRequest';

const VALID_UUID = '9f1c2b7e-5a3d-4f2e-8c11-6b0d7a4e93f5';

const chainRequest = {
  submissionId: VALID_UUID,
  kind: 'chain',
  requestedName: 'Monad',
  contextChain: null,
};

const tokenRequest = {
  submissionId: VALID_UUID,
  kind: 'token',
  requestedName: 'USDT',
  contextChain: 'base',
};

describe('parseFundingRequestSubmission', () => {
  it('accepts a chain request', () => {
    expect(parseFundingRequestSubmission(chainRequest)).toEqual(chainRequest);
  });

  it('accepts a token request scoped to its chain', () => {
    expect(parseFundingRequestSubmission(tokenRequest)).toEqual(tokenRequest);
  });

  it('accepts a chain request with no contextChain at all', () => {
    const { contextChain: _omitted, ...body } = chainRequest;
    expect(parseFundingRequestSubmission(body)).toEqual(chainRequest);
  });

  it('trims the requested name', () => {
    expect(parseFundingRequestSubmission({ ...chainRequest, requestedName: '  Monad ' })).toEqual(
      chainRequest,
    );
  });

  it.each([
    ['a non-object body', 'Monad'],
    ['a bad uuid', { ...chainRequest, submissionId: 'not-a-uuid' }],
    ['a uuid v1', { ...chainRequest, submissionId: '9f1c2b7e-5a3d-1f2e-8c11-6b0d7a4e93f5' }],
    ['an unknown kind', { ...chainRequest, kind: 'wallet' }],
    ['an empty name', { ...chainRequest, requestedName: '   ' }],
    ['a non-string name', { ...chainRequest, requestedName: 42 }],
    [
      'an over-length name',
      { ...chainRequest, requestedName: 'x'.repeat(FUNDING_REQUEST_NAME_MAX_LENGTH + 1) },
    ],
    ['a token request without contextChain', { ...tokenRequest, contextChain: null }],
    ['a token request with an empty contextChain', { ...tokenRequest, contextChain: ' ' }],
    ['a chain request with a contextChain', { ...chainRequest, contextChain: 'base' }],
  ])('rejects %s', (_case, body) => {
    expect(parseFundingRequestSubmission(body)).toBeNull();
  });

  it('drops extra properties so they can never reach the sheet', () => {
    const parsed = parseFundingRequestSubmission({
      ...tokenRequest,
      walletAddress: '0x0000000000000000000000000000000000000001',
      balance: '100',
    });

    expect(parsed).toEqual(tokenRequest);
    expect(Object.keys(parsed ?? {})).toEqual([
      'submissionId',
      'kind',
      'requestedName',
      'contextChain',
    ]);
  });
});

describe('mapFundingRequestToSheetRow', () => {
  it('emits cells in FUNDING_REQUEST_SHEET_COLUMNS order', () => {
    const row = mapFundingRequestToSheetRow(
      parseFundingRequestSubmission(tokenRequest)!,
      '2026-09-28T10:00:00.123Z',
    );

    expect(FUNDING_REQUEST_SHEET_COLUMNS).toEqual([
      'request_id',
      'submitted_at',
      'kind',
      'requested_name',
      'context_chain',
    ]);
    expect(row).toEqual([VALID_UUID, '2026-09-28T10:00:00Z', 'token', 'USDT', 'base']);
  });

  it('writes an empty context cell for a chain request', () => {
    const row = mapFundingRequestToSheetRow(
      parseFundingRequestSubmission(chainRequest)!,
      '2026-09-28T10:00:00.000Z',
    );

    expect(row[4]).toBe('');
  });
});

describe('parsePendingFundingRequestRecord', () => {
  it('round-trips a buffered record', () => {
    const record = { submittedAt: '2026-09-28T10:00:00.000Z', submission: tokenRequest };

    expect(parsePendingFundingRequestRecord(JSON.stringify(record))).toEqual(record);
  });

  it.each([
    ['truncated json', '{"submittedAt":"2026'],
    ['a json array', '[]'],
    ['no submittedAt', JSON.stringify({ submission: tokenRequest })],
    ['a bad submittedAt', JSON.stringify({ submittedAt: 'yesterday', submission: tokenRequest })],
    [
      'a submission that fails validation',
      JSON.stringify({
        submittedAt: '2026-09-28T10:00:00.000Z',
        submission: { ...tokenRequest, kind: 'wallet' },
      }),
    ],
  ])('returns null (quarantine) for %s', (_case, body) => {
    expect(parsePendingFundingRequestRecord(body)).toBeNull();
  });
});
