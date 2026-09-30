/**
 * @jest-environment node
 */
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import type { AchievementData } from '../../types/achievement';
import { generateAchievementImage } from './AchievementImage';

const mockImageResponse = jest.fn();
jest.mock('@takumi-rs/image-response', () => ({
  ImageResponse: jest.fn().mockImplementation((element, options) => {
    mockImageResponse(element, options);
    return { arrayBuffer: async () => new ArrayBuffer(1) };
  }),
}));

const mockGetAchievementData = jest.fn();
jest.mock('../../utils/achievementData', () => ({
  getAchievementData: (...args: unknown[]) => mockGetAchievementData(...args),
}));

const mockFetchMarketImage = jest.fn();
jest.mock('../../utils/marketThumbnail', () => ({
  fetchMarketImage: (...args: unknown[]) => mockFetchMarketImage(...args),
}));

const MARKET_IMAGE_URL = 'https://gateway.autonolas.tech/ipfs/QmMarket';

const DATA: AchievementData = {
  question: 'Does Google have the best AI model end of January?',
  position: 'Yes',
  transactionHash: `0x${'a'.repeat(64)}`,
  betAmount: 1,
  amountWon: 2.4,
  betAmountFormatted: '$1.00',
  amountWonFormatted: '$2.40',
  multiplier: '2.40',
  marketImageUrl: MARKET_IMAGE_URL,
};

const PARAMS = { agent: 'omenstrat', type: 'payout', id: 'bet' } as const;

const renderedCall = () => {
  const [element, options] = mockImageResponse.mock.calls[0] as [
    ReactElement,
    { persistentImages: { src: string }[] },
  ];
  return {
    html: renderToStaticMarkup(element),
    imageKeys: options.persistentImages.map(({ src }) => src),
  };
};

describe('generateAchievementImage', () => {
  beforeEach(() => {
    mockImageResponse.mockReset();
    mockGetAchievementData.mockReset();
    mockFetchMarketImage.mockReset();
    global.fetch = jest.fn().mockResolvedValue({ arrayBuffer: async () => new ArrayBuffer(1) });
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the Omenstrat card with the market icon from a persistent image', async () => {
    mockGetAchievementData.mockResolvedValue(DATA);
    mockFetchMarketImage.mockResolvedValue(new ArrayBuffer(1));

    await expect(generateAchievementImage(PARAMS, 'https://pearl')).resolves.toBeInstanceOf(
      Buffer,
    );

    expect(mockFetchMarketImage).toHaveBeenCalledWith(MARKET_IMAGE_URL);
    const { html, imageKeys } = renderedCall();
    expect(imageKeys).toEqual(['omenstrat', 'market']);
    const marketSrc = html.match(/<img src="([^"]+)" alt="Market"/)?.[1];
    expect(imageKeys).toContain(marketSrc);
  });

  it('renders the Omenstrat card without the icon when the image cannot be fetched', async () => {
    mockGetAchievementData.mockResolvedValue(DATA);
    mockFetchMarketImage.mockResolvedValue(null);

    await expect(generateAchievementImage(PARAMS, 'https://pearl')).resolves.toBeInstanceOf(
      Buffer,
    );

    const { html, imageKeys } = renderedCall();
    expect(imageKeys).toEqual(['omenstrat']);
    expect(html).not.toContain('alt="Market"');
    expect(html).toContain(DATA.question);
  });

  it('does not fetch a market image when the achievement has none', async () => {
    mockGetAchievementData.mockResolvedValue({ ...DATA, marketImageUrl: null });

    await generateAchievementImage(PARAMS, 'https://pearl');

    expect(mockFetchMarketImage).not.toHaveBeenCalled();
    expect(renderedCall().imageKeys).toEqual(['omenstrat']);
  });

  it('renders nothing when the achievement is not a settled win', async () => {
    mockGetAchievementData.mockResolvedValue(null);

    await expect(generateAchievementImage(PARAMS, 'https://pearl')).resolves.toBeNull();
    expect(mockImageResponse).not.toHaveBeenCalled();
  });
});
