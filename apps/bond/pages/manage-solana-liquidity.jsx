import { Meta } from 'components/Meta';
import { WsolTokenManagement } from 'components/BondingProducts/Bonding/TokenManagement/WsolTokenManagement';

const ManageSolanaLiquidityPage = () => (
  <>
    <Meta
      pageTitle="Manage Solana Liquidity"
      description="Manage your Solana-based liquidity for OLAS bonding. Wrap and unwrap SOL, and manage your WSOL tokens for bonding operations."
      pageUrl="manage-solana-liquidity"
    />
    <WsolTokenManagement />
  </>
);

export default ManageSolanaLiquidityPage;
