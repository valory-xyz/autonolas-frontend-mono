import { useEffect, useState } from 'react';
import { AchievementUI } from '../../components/Achievement/AchievementUI';
import { OG_IMAGE_CONFIG } from '../../constants/achievement';
import { AchievementQueryParams, PolymarketBetData } from '../../types/achievement';
import { getPolymarketBet } from 'utils/polymarket';

export default function AgentAchievements() {
  const [data, setData] = useState<PolymarketBetData | null>(null);
    
  const params: AchievementQueryParams = {
    agent: 'polystrat',
    type: 'payout',
    id: '0x74bfbf071a414817d27bf8d098a883a6be925425a3d5fb1ae4097f8bb0593ca498020000',
  };

  // Determine the image src for client-side
  const logoSrc = '/images/polystrat-logo.png';

  useEffect(() => {
    getPolymarketBet(params.id).then((data) => {
      setData(data);
    });
  }, [params.id]);

  if(!data) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          width: OG_IMAGE_CONFIG.WIDTH,
          height: OG_IMAGE_CONFIG.HEIGHT,
        }}
      >
        <AchievementUI params={params} logoSrc={logoSrc} data={data} />
      </div>
    </div>
  );
}
