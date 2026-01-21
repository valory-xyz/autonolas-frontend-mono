import { CSSProperties } from 'react';

import { PearlLogo } from '../../../svgs/pearl';
import { AchievementQueryParams } from 'types';

const colors = {
  text: {
    primary: '#111827',
    secondary: '#6B7280',
  },
  accent: '#7e22ce',
  background: {
    page: '#F8F9FC',
    card: '#FFFFFF',
    divider: '#E5E7EB',
  },
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: colors.background.page,
    backgroundImage:
      'linear-gradient(180deg, rgba(212, 221, 255, 0.4) 0%, rgba(248, 249, 252, 1) 50%)',
    fontFamily: 'Inter, sans-serif',
    position: 'relative',
    padding: 48,
  } as CSSProperties,
  card: {
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 16,
    padding: 32,
    marginTop: 24,
    backgroundColor: colors.background.card,
    width: '75%',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  } as CSSProperties,
  cardTitle: {
    display: 'flex',
    fontSize: 24,
    color: colors.text.primary,
    lineHeight: '1.4',
    marginBottom: 24,
    fontWeight: 600,
  } as CSSProperties,
  divider: {
    display: 'flex',
    width: '100%',
    height: 1,
    backgroundColor: colors.background.divider,
    marginBottom: 24,
  } as CSSProperties,
  statsRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  } as CSSProperties,
};

type StatItemProps = {
  label: string;
  value: string;
};

const StatItem = ({ label, value }: StatItemProps) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
    }}
  >
    <div
      style={{
        display: 'flex',
        fontSize: 16,
        color: colors.text.secondary,
        marginBottom: 8,
      }}
    >
      {label}
    </div>
    <div
      style={{
        display: 'flex',
        fontSize: 24,
        fontWeight: 700,
        color: colors.text.primary,
      }}
    >
      {value}
    </div>
  </div>
);

type BetDetailsProps = {
  question: string;
  stats: StatItemProps[];
};

const BetDetails = ({ question, stats }: BetDetailsProps) => (
  <div style={styles.card}>
    <div style={styles.cardTitle}>{question}</div>
    <div style={styles.divider} />
    <div style={styles.statsRow}>
      {stats.map((stat) => (
        <StatItem key={stat.label} label={stat.label} value={stat.value} />
      ))}
    </div>
  </div>
);

type HeadlineProps = {
  title: string;
  multiplier: string;
  subtitle: string;
  highlightValue: string;
};

const Headline = ({ title, multiplier, subtitle, highlightValue }: HeadlineProps) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
      marginBottom: 24,
    }}
  >
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: 16,
        fontSize: 48,
        fontWeight: 700,
        color: colors.text.primary,
      }}
    >
      <div style={{ display: 'flex' }}>{title}</div>
      <div
        style={{
          display: 'flex',
          marginLeft: 12,
          fontSize: 48,
          fontWeight: 700,
          color: colors.accent,
        }}
      >
        {multiplier}
      </div>
    </div>
    <div
      style={{
        display: 'flex',
        fontSize: 20,
        color: colors.text.secondary,
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex' }}>{subtitle}</div>
      <div
        style={{
          display: 'flex',
          fontWeight: 700,
          marginLeft: 6,
          color: colors.text.primary,
        }}
      >
        {highlightValue}
      </div>
    </div>
  </div>
);

type AgentLogoProps = {
  src?: string;
};

const AgentLogo = ({ src }: AgentLogoProps) => (
  <img
    src={src}
    alt="Agent Logo"
    style={{
      width: 'auto',
      height: 'auto',
      maxWidth: 100,
      maxHeight: 100,
      marginBottom: 32,
      borderRadius: 20,
    }}
  />
);

type PolystratPayoutProps = {
  params: AchievementQueryParams;
  logoSrc?: string;
};

export const PolystratPayout = ({ logoSrc }: PolystratPayoutProps) => {
  // TODO: Use real data from params
  const payoutData = {
    headline: {
      title: 'Big win',
      multiplier: 'x2.4',
      subtitle: 'Your Polystrat made a high-return prediction and collected',
      highlightValue: '$2.4',
    },
    bet: {
      question: 'Does Google have the best AI model end of January?',
      stats: [
        { label: 'Position', value: 'Yes' },
        { label: 'Amount', value: '$1.0' },
        { label: 'Won', value: '$2.4' },
      ],
    },
  };

  return (
    <div style={styles.container}>
      <AgentLogo src={logoSrc} />

      <Headline
        title={payoutData.headline.title}
        multiplier={payoutData.headline.multiplier}
        subtitle={payoutData.headline.subtitle}
        highlightValue={payoutData.headline.highlightValue}
      />

      <BetDetails question={payoutData.bet.question} stats={payoutData.bet.stats} />

      <div
        style={{
          display: 'flex',
          position: 'absolute',
          bottom: 32,
          right: 32,
          alignItems: 'center',
        }}
      >
        <PearlLogo logoWidth={104} logoHeight={32} />
      </div>
    </div>
  );
};
