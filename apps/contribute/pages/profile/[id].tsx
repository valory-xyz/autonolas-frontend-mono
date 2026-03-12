import Meta from 'components/meta';
import { Profile } from 'components/Profile';

const ProfilePage = () => (
  <>
    <Meta
      pageTitle="Profile"
      description="View contributor profile details including points earned, badge level, completed actions, and contribution history in the Olas ecosystem."
      pageUrl="profile"
    />
    <Profile />
  </>
);

export default ProfilePage;
