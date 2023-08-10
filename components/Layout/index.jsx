import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import {
  Alert, Layout, Menu, Tag,
} from 'antd/lib';
import PropTypes from 'prop-types';
import { getAgentHash, getSupportedNetworks } from 'common-util/functions';
import { COLOR } from '@autonolas/frontend-library';
import { setAllAgents } from 'store/setup/actions';
import Login from '../Login';
import Footer from './Footer';
import { getAgents, getTotalForAllAgents } from '../Home/Registry/utils';
import { CustomLayout, Container, Logo } from './styles';

const LogoSvg = dynamic(() => import('common-util/SVGs/logo'));

const { Header, Content } = Layout;

const NavigationBar = ({ children }) => {
  const dispatch = useDispatch();
  const router = useRouter();

  const chainId = useSelector((state) => state?.setup?.chainId);
  const agentsList = useSelector((state) => state?.setup?.allAgents);
  const { pathname } = router;
  const [selectedMenu, setSelectedMenu] = useState([]);

  // to set default menu on first render
  useEffect(() => {
    if (pathname) {
      const name = pathname.split('/')[1];
      setSelectedMenu(name || 'registry');
    }
  }, [pathname]);

  // if selected menu is "mech" & doesn't contains id,
  // redirect to mech with id & hash from the 3rd agent
  useEffect(() => {
    if (selectedMenu === 'mech' && !router.query?.id) {
      const { mech, agentHashes } = agentsList[2];
      const hash = getAgentHash(agentHashes);
      router.push(`/mech?id=${mech}&hash=${hash}`);
    }
  }, [selectedMenu, agentsList]);

  // fetch all agents once chainId is available & set in redux
  useEffect(() => {
    if (chainId) {
      (async () => {
        try {
          const total = await getTotalForAllAgents();
          const agents = await getAgents(total);
          dispatch(setAllAgents(agents));
        } catch (error) {
          console.error(error);
        }
      })();
    }
  }, [chainId]);

  const handleMenuItemClick = ({ key }) => {
    router.push(`/${key}`);
    setSelectedMenu(key);
  };

  return (
    <CustomLayout pathname={router.pathname}>
      <Header>
        <div className="column-1">
          <Logo data-testid="member-logo">
            <LogoSvg />
            <span className="title-text">Mech Hub</span>
            &nbsp;
            <Tag color={COLOR.RED}>Beta</Tag>
          </Logo>
        </div>

        <Menu
          theme="light"
          mode="horizontal"
          selectedKeys={[selectedMenu]}
          onClick={handleMenuItemClick}
          items={[
            { key: 'registry', label: 'Registry' },
            { key: 'factory', label: 'Factory' },
            { key: 'mech', label: 'Mech' },
            { key: 'docs', label: 'Docs' },
          ]}
        />
        <Login />
      </Header>

      <Content className="site-layout">
        <div className="site-layout-background">
          {chainId && !getSupportedNetworks().includes(Number(chainId)) && (
            <>
              <Alert
                showIcon
                message={(
                  <>
                    You are on a wrong network. Please switch to Gnosis Chain
                    network or&nbsp;
                    <a
                      href="https://discord.com/invite/z2PT65jKqQ"
                      target="_blank"
                      rel="noreferrer"
                    >
                      join our Discord
                    </a>
                    &nbsp;to request other networks.
                  </>
                )}
                type="error"
                className="mb-12"
              />
            </>
          )}
          {children}
        </div>
      </Content>

      <Container />
      <Footer />
    </CustomLayout>
  );
};

NavigationBar.propTypes = {
  children: PropTypes.element,
};

NavigationBar.defaultProps = {
  children: null,
};

export default NavigationBar;
