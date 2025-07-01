import { InfoCircleFilled } from '@ant-design/icons';
import { Layout as AntdLayout, Button, Flex, Grid, Typography } from 'antd';
import { get } from 'lodash';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { notifyError } from '@autonolas/frontend-library';

import { LogoSvg } from 'common-util/SVGs/logo';
import { getLeaderboardList, getMemoryDetails } from 'common-util/api';
import Login from 'components/Login';
import {
  setIsLeaderboardLoading,
  setIsMemoryDetailsLoading,
  setIsVerified,
  setLeaderboard,
  setMemoryDetails,
  useAppSelector,
} from 'store/setup';
import { MENU_WIDTH } from 'util/constants';

import Footer from './Footer';
import { Menu, NavDropdown } from './Menu';
import { ServiceStatus } from './ServiceStatus';
import { Banner, CustomHeader, CustomHeaderContent, CustomLayout, Logo, RightMenu } from './styles';
import { getAddressStatus } from './utils';

const { Content } = AntdLayout;
const { useBreakpoint } = Grid;
const { Text } = Typography;

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const screens = useBreakpoint();
  const router = useRouter();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const { pathname } = router;

  const [isBannerVisible, setIsBannerVisible] = useState(true);
  const handleBannerClose = () => setIsBannerVisible(false);

  const dispatch = useDispatch();
  const account = useAppSelector((state) => get(state, 'setup.account'));
  const chainId = useAppSelector((state) => get(state, 'setup.chainId'));

  // load leaderboard list only once on page load
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        dispatch(setIsLeaderboardLoading(true));
        const list = await getLeaderboardList();
        dispatch(setLeaderboard(list));
      } catch (error) {
        console.error(error);
      } finally {
        dispatch(setIsLeaderboardLoading(false));
      }
    };

    fetchLeaderboard();
  }, [chainId, dispatch]);

  // load memory details only once on page load
  useEffect(() => {
    const getData = async () => {
      try {
        dispatch(setIsMemoryDetailsLoading(true));

        const { response } = await getMemoryDetails();
        dispatch(setMemoryDetails(response));
      } catch (error) {
        notifyError('Error fetching members');
      } finally {
        dispatch(setIsMemoryDetailsLoading(false));
      }
    };

    getData();
  }, [dispatch]);

  /**
   * fetch if wallet is verified on page load
   */
  useEffect(() => {
    const verifyAccount = async () => {
      // on first render, if there is no account (ie. wallet not connected),
      // mark as not verified
      if (!account) {
        dispatch(setIsVerified(false));
      }

      if (account && chainId) {
        try {
          const response = await getAddressStatus(account);
          dispatch(setIsVerified(response));
        } catch (error) {
          window.console.error(error);
        }
      }
    };
    verifyAccount();
  }, [account, chainId, dispatch]);

  const isPadded = ['chat', 'member-chat'].some((e) => pathname.includes(e));

  return (
    <CustomLayout $isPadded={isPadded} $isBannerVisible={isBannerVisible}>
      <CustomHeader $isBannerVisible={isBannerVisible}>
        {isBannerVisible && (
          <Banner
            message={
              <>
                <Text ellipsis>
                  <InfoCircleFilled className="mr-8" style={{ color: '#1677FF' }} />
                  Contribute staking is live! Spread the word about Olas on X and have a chance to
                  earn rewards.
                </Text>{' '}
                <Link href="/staking">Set up staking now</Link>
              </>
            }
            type="info"
            closable
            onClose={handleBannerClose}
          />
        )}
        <CustomHeaderContent>
          <Flex align="center">
            <Link href="/">
              <Logo>
                <LogoSvg />
              </Logo>
            </Link>
            <NavDropdown />
            {!screens.md && (
              <Button className="ml-4" onClick={() => setIsMenuVisible((prev) => !prev)}>
                Menu
              </Button>
            )}
          </Flex>
          <RightMenu>
            <Login />
          </RightMenu>
        </CustomHeaderContent>
      </CustomHeader>

      <Menu
        isBannerVisible={isBannerVisible}
        onBannerClose={handleBannerClose}
        isMenuVisible={isMenuVisible}
        onMenuClose={() => setIsMenuVisible(false)}
      />

      <Content className="site-layout" style={{ marginLeft: screens.md ? `${MENU_WIDTH}px` : '0' }}>
        <div className="site-layout-background">{children}</div>

        {!isPadded && (
          <div className="contribute-footer">
            <Footer />
          </div>
        )}
      </Content>

      {!isPadded && <ServiceStatus />}
    </CustomLayout>
  );
};
