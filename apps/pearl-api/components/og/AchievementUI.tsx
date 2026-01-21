import type { AchievementQueryParams } from '../../types/achievement';
import { PearlLogo } from '../../svgs/pearl';

type PolystratPayoutProps = AchievementUIProps;

const PolystratPayout = ({ logoSrc }: PolystratPayoutProps) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        background:
          'radial-gradient(97.37% 100% at 50% 0%, rgba(46, 92, 255, 0.25) 0%, rgba(189, 203, 255, 0.15) 100%)',
        fontFamily: 'sans-serif',
        position: 'relative',
      }}
    >
      <img
        src={logoSrc}
        alt="Polystrat Logo"
        style={{
          width: '100px',
          height: '100px',
          marginBottom: 40,
          objectFit: 'contain',
        }}
      />

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          gap: 32,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 36 }}>
          Big win
          <span
            style={{
              padding: 12,
              borderRadius: 12,
              marginLeft: 12,
              backgroundColor: '#3F53641a',
            }}
          >
            x2.4
          </span>
        </h1>
        <p style={{ margin: 0, fontSize: 24 }}>
          Your Polystrat made a high-return prediction and collected{' '}
          <span style={{ fontWeight: 'bold' }}>$2.4</span>
        </p>
      </div>

      <div style={{ position: 'absolute', bottom: 24, right: 24 }}>
        <PearlLogo />
      </div>
    </div>
  );
};

type AchievementUIProps = {
  params: AchievementQueryParams;
  logoSrc?: string;
};

export const AchievementUI = ({ params, logoSrc }: AchievementUIProps) => {
  const { agent } = params;

  if (agent === 'polystrat') return <PolystratPayout params={params} logoSrc={logoSrc} />;

  return null;
};
