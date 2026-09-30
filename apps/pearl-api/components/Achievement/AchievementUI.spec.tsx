import { renderToStaticMarkup } from 'react-dom/server';

import type { AchievementData, AchievementQueryParams } from '../../types/achievement';
import { AchievementUI } from './AchievementUI';

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

const render = (agent: AchievementQueryParams['agent'], marketImageSrc?: string) =>
  renderToStaticMarkup(
    <AchievementUI
      params={{ agent, type: 'payout', id: 'bet' }}
      logoSrc={agent}
      marketImageSrc={marketImageSrc}
      data={DATA}
    />,
  );

describe('AchievementUI', () => {
  it('renders the Omenstrat card with Omen copy and the market icon', () => {
    const html = render('omenstrat', 'market');

    expect(html).toContain('Made by Omenstrat AI agent on Omen Markets');
    expect(html).toContain('Get your own Omenstrat');
    expect(html).toContain('2.40x');
    expect(html).toContain('src="market"');
    expect(html).not.toMatch(/Polystrat|Polymarket|Polygon/);
  });

  it('renders the Omenstrat card without a market icon when there is none', () => {
    const html = render('omenstrat');

    expect(html).not.toContain('alt="Market"');
    expect(html).toContain(DATA.question);
  });

  it('keeps the Polystrat card copy and renders no market icon', () => {
    const html = render('polystrat', 'market');

    expect(html).toContain('Made by Polystrat AI agent on Polymarket');
    expect(html).toContain('Get your own Polystrat');
    expect(html).not.toContain('alt="Market"');
  });

  it('keeps the Polystrat card layout', () => {
    expect(render('polystrat')).toMatchSnapshot();
  });

  it('falls back for an unsupported agent', () => {
    expect(render('optimus')).toContain('Agent not yet supported.');
  });
});
