import { AchievementUI } from '../../components/Achievement/AchievementUI';
import { OG_IMAGE_CONFIG } from '../../constants/achievement';
import { AchievementQueryParams } from '../../types/achievement';

export default function AgentAchievements() {
  const params: AchievementQueryParams = {
    agent: 'polystrat',
    type: 'payout',
    id: '123',
  };

  // Determine the image src for client-side
  const logoSrc = '/images/polystrat-logo.png';

  return (
    <div
      style={{
        width: OG_IMAGE_CONFIG.WIDTH,
        height: OG_IMAGE_CONFIG.HEIGHT,
      }}
    >
      <AchievementUI params={params} logoSrc={logoSrc} />
    </div>
  );
}
