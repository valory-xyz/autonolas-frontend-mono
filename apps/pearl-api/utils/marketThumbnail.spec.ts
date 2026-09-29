/**
 * @jest-environment node
 */
import { byte32ToIpfsCidV0, fetchMarketImage, getMarketImageUrl } from './marketThumbnail';

const mockRequest = jest.fn();
jest.mock('./graphql/client', () => ({
  getOmenThumbnailClient: () =>
    process.env.THEGRAPH_API_KEY ? { request: (...args: unknown[]) => mockRequest(...args) } : null,
}));

const IMAGE_HASH = '0x7d5a99f603f231d53a4f39d1521f98d2e8bb279cf29bebfd0687dc98458e7f89';
const IMAGE_CID = 'QmWmyoMoctfbAaiEs2G46gpeUmhqFRDW6KWo64y5r581Vz';

describe('byte32ToIpfsCidV0', () => {
  it('encodes a sha2-256 digest as a CIDv0', () => {
    expect(byte32ToIpfsCidV0(IMAGE_HASH)).toBe(IMAGE_CID);
  });

  it('accepts a digest without the 0x prefix', () => {
    expect(
      byte32ToIpfsCidV0('0000000000000000000000000000000000000000000000000000000000000001'),
    ).toBe('QmNLei78zWmzUdbeRB3CiUfAizWUrbeeZh5K1rhAQKCh52');
  });
});

describe('getMarketImageUrl', () => {
  beforeEach(() => {
    mockRequest.mockReset();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    process.env.THEGRAPH_API_KEY = 'key';
  });

  afterEach(() => {
    delete process.env.THEGRAPH_API_KEY;
    jest.restoreAllMocks();
  });

  it('returns the gateway URL of the mapped image', async () => {
    mockRequest.mockResolvedValue({ omenThumbnailMapping: { image_hash: IMAGE_HASH } });

    await expect(getMarketImageUrl('0xABC')).resolves.toBe(
      `https://gateway.autonolas.tech/ipfs/${IMAGE_CID}`,
    );
    expect(mockRequest).toHaveBeenCalledWith(expect.anything(), { id: '0xabc' });
  });

  it('returns null without an API key and makes no request', async () => {
    delete process.env.THEGRAPH_API_KEY;

    await expect(getMarketImageUrl('0xabc')).resolves.toBeNull();
    expect(mockRequest).not.toHaveBeenCalled();
  });

  it('returns null when the market has no mapping', async () => {
    mockRequest.mockResolvedValue({ omenThumbnailMapping: null });

    await expect(getMarketImageUrl('0xabc')).resolves.toBeNull();
  });

  it('returns null when the lookup fails', async () => {
    mockRequest.mockRejectedValue(new Error('gateway down'));

    await expect(getMarketImageUrl('0xabc')).resolves.toBeNull();
  });
});

describe('fetchMarketImage', () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns the image bytes on success', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response(new Uint8Array([1, 2, 3])));

    const image = await fetchMarketImage('https://example.com/x.png');

    expect(Array.from(new Uint8Array(image as ArrayBuffer))).toEqual([1, 2, 3]);
  });

  it('returns null on a non-OK response', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response(null, { status: 404 }));

    await expect(fetchMarketImage('https://example.com/x.png')).resolves.toBeNull();
  });

  it('returns null when the fetch throws', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('timeout'));

    await expect(fetchMarketImage('https://example.com/x.png')).resolves.toBeNull();
  });
});
