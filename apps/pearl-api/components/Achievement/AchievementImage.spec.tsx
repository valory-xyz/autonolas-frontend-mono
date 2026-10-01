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

const DATA: AchievementData = {
  question: 'Does Google have the best AI model end of January?',
  position: 'Yes',
  transactionHash: `0x${'a'.repeat(64)}`,
  betAmount: 1,
  amountWon: 2.4,
  betAmountFormatted: '$1.00',
  amountWonFormatted: '$2.40',
  multiplier: '2.40',
  marketImageUrl: null,
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
    global.fetch = jest.fn().mockResolvedValue({ arrayBuffer: async () => new ArrayBuffer(1) });
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the Omenstrat card with only the agent logo', async () => {
    mockGetAchievementData.mockResolvedValue(DATA);

    await expect(generateAchievementImage(PARAMS, 'https://pearl')).resolves.toBeInstanceOf(Buffer);

    const { html, imageKeys } = renderedCall();
    expect(imageKeys).toEqual(['omenstrat']);
    expect(html).not.toContain('alt="Market"');
    expect(html).toContain(DATA.question);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith('https://pearl/images/omenstrat-logo.png');
  });

  it('renders nothing when the achievement is not a settled win', async () => {
    mockGetAchievementData.mockResolvedValue(null);

    await expect(generateAchievementImage(PARAMS, 'https://pearl')).resolves.toBeNull();
    expect(mockImageResponse).not.toHaveBeenCalled();
  });
});
