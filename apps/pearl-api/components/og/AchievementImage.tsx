import { ImageResponse } from '@vercel/og';

import type { AchievementQueryParams } from '../../types/achievement';
import { OG_IMAGE_CONFIG } from '../../constants/achievement';

const AGENT_COLORS: Record<string, string> = {
  polymarket: '#4F46E5',
  trader: '#059669',
  modius: '#DC2626',
  optimus: '#7C3AED',
};

const DEFAULT_COLOR = '#1F2937';

export const generateAchievementImage = async (
  params: AchievementQueryParams,
): Promise<ImageResponse> => {
  const { agent, type, id } = params;
  const bgColor = AGENT_COLORS[agent] || DEFAULT_COLOR;

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          backgroundColor: bgColor,
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 24,
            marginBottom: 20,
            opacity: 0.8,
          }}
        >
          OLAS Achievement
        </div>

        {/* Agent name */}
        <div
          style={{
            display: 'flex',
            fontSize: 64,
            fontWeight: 'bold',
            textTransform: 'capitalize',
            marginBottom: 16,
          }}
        >
          {agent}
        </div>

        {/* Achievement type */}
        <div
          style={{
            display: 'flex',
            fontSize: 36,
            textTransform: 'uppercase',
            letterSpacing: 4,
            marginBottom: 24,
            opacity: 0.9,
          }}
        >
          {type}
        </div>

        {/* Achievement ID */}
        <div
          style={{
            display: 'flex',
            fontSize: 120,
            fontWeight: 'bold',
          }}
        >
          #{id}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            bottom: 40,
            fontSize: 20,
            opacity: 0.6,
          }}
        >
          olas.network
        </div>
      </div>
    ),
    {
      width: OG_IMAGE_CONFIG.WIDTH,
      height: OG_IMAGE_CONFIG.HEIGHT,
    },
  );
};

/**
 * Convert ImageResponse to Buffer for IPFS upload
 */
export const imageResponseToBuffer = async (imageResponse: ImageResponse): Promise<Buffer> => {
  const arrayBuffer = await imageResponse.arrayBuffer();
  return Buffer.from(arrayBuffer);
};
