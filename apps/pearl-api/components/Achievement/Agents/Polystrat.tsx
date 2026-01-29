import { CSSProperties } from 'react';

import { SquareArrowUpRight } from '../../../svgs/squareArrowUpRight';

import { AchievementData, AchievementQueryParams } from 'types/achievement';

const colors = {
  text: {
    primary: '#FFFFFF',
    secondary: '#9F92B2',
  },
  accent: '#1AFF7B',
  accentBackground: '#3B3B67',
  card: {
    background: '#3F2565',
    inner: '#2B194A',
  },
};

const styles: Record<string, CSSProperties> = {
  container: {
    fontFamily: 'Inter, sans-serif',
    position: 'relative',
    backgroundColor: colors.card.background,
    width: 1200,
    height: 630,
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    padding: '40px 40px 0',
    backgroundColor: colors.card.background,
    width: '100%',
    height: '100%',
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 36,
  },
  headerTitle: {
    display: 'flex',
    fontSize: '38px',
    fontWeight: 500,
    color: colors.text.primary,
    marginBottom: 8,
  },
  headerSubtitle: {
    display: 'flex',
    fontSize: 26,
    fontWeight: 400,
    gap: 12,
    color: colors.text.secondary,
    alignItems: 'center',
  },
  headerMultiplier: {
    display: 'flex',
    fontSize: 61,
    fontWeight: 700,
    color: colors.accent,
    backgroundColor: colors.accentBackground,
    padding: '16px 24px',
    borderRadius: 12,
  },
  divider: {
    display: 'flex',
    width: '100%',
    height: 1,
    backgroundColor: '#FFFFFF33',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '300px',
  },
  statLabel: {
    display: 'flex',
    fontSize: 26,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  statValue: {
    display: 'flex',
    fontSize: 38,
    fontWeight: 600,
    color: colors.text.primary,
  },
  statsRow: {
    display: 'flex',
    flexDirection: 'row',
    padding: '30px 40px',
    gap: 24,
  },
  marketCard: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: colors.card.inner,
    borderRadius: 16,
    width: '100%',
  },
  marketQuestion: {
    display: 'flex',
    fontWeight: 450,
    color: colors.text.primary,
    padding: '38px 40px',
    lineHeight: 1.4,
  },
  ctaButton: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF1A',
    borderRadius: '10px',
    padding: '16px 30px',
    alignSelf: 'center',
    gap: '16px',
  },
  ctaLogo: {
    width: '46px',
    height: '46px',
  },
  ctaText: {
    display: 'flex',
    fontSize: 30,
    fontWeight: 500,
    color: colors.text.primary,
  },
};

type HeaderProps = {
  title: string;
  multiplier: string;
  subtitle: string;
};

const Header = ({ title, multiplier, subtitle }: HeaderProps) => (
  <div style={styles.header}>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={styles.headerTitle}>{title}</div>
      <div style={styles.headerSubtitle}>
        {subtitle}
        <SquareArrowUpRight
          style={{
            width: '26px',
            height: '26px',
            color: colors.text.secondary,
          }}
        />
      </div>
    </div>
    <div style={styles.headerMultiplier}>{multiplier}</div>
  </div>
);

const DashedDivider = () => <div style={styles.divider} />;

type StatItemProps = {
  label: string;
  value: string;
};

const StatItem = ({ label, value }: StatItemProps) => (
  <div style={styles.statItem}>
    <div style={styles.statLabel}>{label}</div>
    <div style={styles.statValue}>{value}</div>
  </div>
);

type StatsRowProps = {
  stats: StatItemProps[];
};

const StatsRow = ({ stats }: StatsRowProps) => (
  <div style={styles.statsRow}>
    {stats.map((stat) => (
      <StatItem key={stat.label} label={stat.label} value={stat.value} />
    ))}
  </div>
);

type MarketCardProps = {
  question: string;
  stats: StatItemProps[];
};

const MarketCard = ({ question, stats }: MarketCardProps) => {
  const isLongQuestion = question.length > 120;

  return (
    <div style={{ ...styles.marketCard, marginBottom: isLongQuestion ? 32 : 40 }}>
      <div style={{ ...styles.marketQuestion, fontSize: isLongQuestion ? 24 : 30 }}>{question}</div>
      <DashedDivider />
      <StatsRow stats={stats} />
    </div>
  );
};

type CTAButtonProps = {
  logoSrc?: string;
};

const CTAButton = ({ logoSrc }: CTAButtonProps) => (
  <div style={styles.ctaButton}>
    <img src={logoSrc} style={styles.ctaLogo} />
    <div style={styles.ctaText}>Get your own Polystrat</div>
    <SquareArrowUpRight style={{ width: '32px', height: '32px', color: '#FFFFFF' }} />
  </div>
);

type PolystratPayoutProps = {
  params: AchievementQueryParams;
  logoSrc?: string;
  data: AchievementData;
};

export const PolystratPayout = ({ logoSrc, data }: PolystratPayoutProps) => {
  if (!data) return null;

  const payoutData = {
    question: data.question,
    stats: [
      { label: 'Position', value: data.position },
      { label: 'Amount', value: data.betAmountFormatted },
      { label: 'Won', value: data.amountWonFormatted },
    ],
    header: {
      multiplier: `${data.multiplier}x`,
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <Header
          title={'Successful prediction'}
          multiplier={payoutData.header.multiplier}
          subtitle={'Made by Polystrat AI agent on Polymarket'}
        />
        <MarketCard question={payoutData.question} stats={payoutData.stats} />
        <CTAButton logoSrc={logoSrc} />
      </div>
    </div>
  );
};
