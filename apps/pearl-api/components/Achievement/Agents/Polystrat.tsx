import { PearlLogo } from '../../../svgs/pearl';
import { AchievementQueryParams } from 'types';

type PolystratPayoutProps = {
  params: AchievementQueryParams;
  logoSrc?: string;
};

// TODO: Use real data.
const BetDetails = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 16,
        padding: 32,
        marginTop: 24,
        backgroundColor: '#FFFFFF',
        width: '75%',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      }}
    >
      <div
        style={{
          display: 'flex',
          fontSize: 24,
          color: '#111827',
          lineHeight: '1.4',
          marginBottom: 24,
          fontWeight: 600,
        }}
      >
        Does Google have the best AI model end of January?
      </div>

      <div
        style={{
          display: 'flex',
          width: '100%',
          height: 1,
          backgroundColor: '#E5E7EB',
          marginBottom: 24,
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: '100%',
        }}
      >
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
              color: '#6B7280',
              marginBottom: 8,
            }}
          >
            Position
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 24,
              fontWeight: 700,
              color: '#111827',
            }}
          >
            Yes
          </div>
        </div>
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
              color: '#6B7280',
              marginBottom: 8,
            }}
          >
            Amount
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 24,
              fontWeight: 700,
              color: '#111827',
            }}
          >
            $1.0
          </div>
        </div>
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
              color: '#6B7280',
              marginBottom: 8,
            }}
          >
            Won
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 24,
              fontWeight: 700,
              color: '#111827',
            }}
          >
            $2.4
          </div>
        </div>
      </div>
    </div>
  );
};

export const PolystratPayout = ({ logoSrc }: PolystratPayoutProps) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: '#F8F9FC',
        backgroundImage:
          'linear-gradient(180deg, rgba(212, 221, 255, 0.4) 0%, rgba(248, 249, 252, 1) 50%)',
        fontFamily: 'Inter, sans-serif',
        position: 'relative',
        padding: 48,
      }}
    >
      <img
        src={logoSrc}
        alt="Polystrat Logo"
        style={{
          width: 'auto',
          height: 'auto',
          maxWidth: 100,
          maxHeight: 100,
          marginBottom: 32,
          borderRadius: 20,
        }}
      />

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
            color: '#111827',
          }}
        >
          <div style={{ display: 'flex' }}>Big win</div>
          <div
            style={{
              display: 'flex',
              marginLeft: 12,
              fontSize: 48,
              fontWeight: 700,
              color: '#7e22ce',
            }}
          >
            x2.4
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 20,
            color: '#6B7280',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex' }}>
            Your Polystrat made a high-return prediction and collected
          </div>
          <div
            style={{
              display: 'flex',
              fontWeight: 700,
              marginLeft: 6,
              color: '#111827',
            }}
          >
            $2.4
          </div>
        </div>
      </div>

      <BetDetails />

      <div
        style={{
          display: 'flex',
          position: 'absolute',
          bottom: 32,
          right: 32,
          alignItems: 'center',
        }}
      >
        <PearlLogo style={{ width: 104, height: 32 }} />
      </div>
    </div>
  );
};
