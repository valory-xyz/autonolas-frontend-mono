/**
 * @jest-environment node
 */
import type { NextApiRequest, NextApiResponse } from 'next';

import handler from '../../../pages/api/web3auth/status';
import { createRes } from '../helpers';

const call = (method = 'GET', origin?: string) => {
  const res = createRes();
  handler(
    { method, query: {}, headers: origin ? { origin } : {} } as unknown as NextApiRequest,
    res as unknown as NextApiResponse,
  );
  return res;
};

describe('GET /api/web3auth/status', () => {
  const original = process.env.WEB3AUTH_ENABLED;

  afterEach(() => {
    if (original === undefined) delete process.env.WEB3AUTH_ENABLED;
    else process.env.WEB3AUTH_ENABLED = original;
  });

  it('returns enabled: true when WEB3AUTH_ENABLED is "true"', () => {
    process.env.WEB3AUTH_ENABLED = 'true';

    const res = call();

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ enabled: true });
  });

  it('returns enabled: false when WEB3AUTH_ENABLED is unset', () => {
    delete process.env.WEB3AUTH_ENABLED;

    const res = call();

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ enabled: false });
  });

  it('returns enabled: false for any value other than "true"', () => {
    process.env.WEB3AUTH_ENABLED = 'TRUE';

    expect(call().body).toEqual({ enabled: false });
  });

  it('is never cached', () => {
    process.env.WEB3AUTH_ENABLED = 'true';

    expect(call().headers['Cache-Control']).toBe('no-store');
  });

  it('applies CORS for a localhost origin', () => {
    const res = call('GET', 'http://localhost:3000');

    expect(res.headers['Access-Control-Allow-Origin']).toBe('http://localhost:3000');
  });

  it('answers the CORS preflight with 204', () => {
    const res = call('OPTIONS', 'http://localhost:3000');

    expect(res.statusCode).toBe(204);
    expect(res.headers['Allow']).toBe('GET, OPTIONS');
  });

  it('rejects other methods with 405', () => {
    const res = call('POST');

    expect(res.statusCode).toBe(405);
    expect(res.headers['Allow']).toBe('GET, OPTIONS');
    expect(res.body).toEqual({ error: 'Method Not Allowed' });
  });
});
