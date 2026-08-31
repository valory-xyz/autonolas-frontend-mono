import { getIpfsUrl } from 'libs/ui-components/src/lib/AddressLink';

// The subgraph path emits raw 32-byte hex digests; mech-analytics
// emits already-encoded base32/base58 CIDs. The prefixing must only
// fire on the raw-hex shape — an already-encoded CID must pass
// through unchanged or the gateway 404s.

describe('getIpfsUrl', () => {
  it.each([
    // dag-pb CIDv1
    'bafybeiftrasm4o7jmwos7fwg6lgwtwhrwk4frlv44o4fpveop6w2g4jh4q',
    // raw-codec CIDv1 (what `ipfs add --raw-leaves` yields)
    'bafkreidon7wwjt7yynzqhczbaflvirbtaxsrkyvbnjljyaxpzdhqzzu32e',
    // dag-cbor CIDv1
    'bafyreig5r2vh4nnrqfaocgjeq3rtjzt34loxrbe5bwq6ck7g2sc2ynkxbm',
    // base58 CIDv0
    'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
  ])('passes multibase CID %p through unchanged', (cid) => {
    expect(getIpfsUrl(cid)).toBe(`https://gateway.autonolas.tech/ipfs/${cid}`);
  });

  it('prefixes a raw hex digest with the multibase/multicodec header', () => {
    const raw = '262153ef3b28eafa8fb577d01606dfb458a71bed48f6a8145486e9eaa9bf1a28';
    expect(getIpfsUrl(raw)).toBe(`https://gateway.autonolas.tech/ipfs/f01701220${raw}`);
  });

  it('strips a leading 0x on the raw hex path before prefixing', () => {
    const raw = '262153ef3b28eafa8fb577d01606dfb458a71bed48f6a8145486e9eaa9bf1a28';
    expect(getIpfsUrl(`0x${raw}`)).toBe(`https://gateway.autonolas.tech/ipfs/f01701220${raw}`);
  });

  it('does not double-prefix an already-prefixed raw hash', () => {
    const already = 'f01701220262153ef3b28eafa8fb577d01606dfb458a71bed48f6a8145486e9eaa9bf1a28';
    expect(getIpfsUrl(already)).toBe(`https://gateway.autonolas.tech/ipfs/${already}`);
  });
});
