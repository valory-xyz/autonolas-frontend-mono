import { useState, useEffect } from 'react';
import { Tabs, Typography } from 'antd';
import { useRouter } from 'next/router';
import { notifyError } from '@autonolas/frontend-library';

import { NAV_TYPES } from 'util/constants';
import { isMyTab } from 'common-util/List/ListTable/helpers';
import { ListTable, useExtraTabContent } from 'common-util/List/ListTable';
import { useHelpers } from 'common-util/hooks';
import { useAllAgents, useMyAgents, useSearchAgents } from './useAgentsList';
import { getAgents, getFilteredAgents, getTotalForAllAgents, getTotalForMyAgents } from './utils';
import { PageMainContainer } from 'components/styles';

const { Title } = Typography;

const ALL_AGENTS = 'all-agent-blueprints';
const MY_AGENTS = 'my-agent-blueprints';

const ListAgents = () => {
  const router = useRouter();

  const [currentTab, setCurrentTab] = useState(isMyTab(router) ? MY_AGENTS : ALL_AGENTS);

  const { account, chainId, links, isL1OnlyNetwork, isSvm, isMainnet } = useHelpers();

  const getAllAgents = useAllAgents();
  const getMyAgents = useMyAgents();
  const getAgentsBySearch = useSearchAgents();

  /**
   * extra tab content & view click
   */
  const { searchValue, extraTabContent, clearSearch } = useExtraTabContent({
    onRegisterClick: () => router.push(links.MINT_AGENT),
    isMyTab: currentTab === MY_AGENTS,
    mintButtonText: 'Add Agent Blueprint',
  });
  const onViewClick = (id) => router.push(`${links.AGENTS}/${id}`);

  /**
   * filtered list
   */
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [list, setList] = useState([]);

  // fetch total
  useEffect(() => {
    (async () => {
      if (isSvm) return;
      if (!isL1OnlyNetwork) return;
      if (searchValue !== '') return;

      try {
        let totalTemp = null;
        if (currentTab === ALL_AGENTS) {
          totalTemp = await getTotalForAllAgents();
        } else if (currentTab === MY_AGENTS && account) {
          totalTemp = await getTotalForMyAgents(account);
        }

        setTotal(Number(totalTemp));
        if (Number(totalTemp) === 0) {
          setIsLoading(false);
          setList([]);
        }
      } catch (e) {
        notifyError('Error fetching agents');
        console.error(e);
      }
    })();
  }, [account, chainId, isL1OnlyNetwork, currentTab, searchValue, isSvm]);

  // fetch the list (without search)
  useEffect(() => {
    (async () => {
      if (isSvm) return;
      if (!isL1OnlyNetwork) return;
      if (searchValue) return;

      if (total && currentPage) {
        setIsLoading(true);

        try {
          // All agents
          if (currentTab === ALL_AGENTS) {
            const everyAgents = isMainnet
              ? await getAllAgents(currentPage)
              : await getAgents(total, currentPage);
            setList(everyAgents);
          } else if (currentTab === MY_AGENTS && account) {
            /**
             * My agents
             * - search by `account` as searchValue
             * - API will be called only once & store the complete list
             */
            const myAgents = isMainnet
              ? await getMyAgents(account, currentPage)
              : await getFilteredAgents(account);
            setList(myAgents);
          }
        } catch (e) {
          notifyError('Error fetching agents');
          console.error(e);
        } finally {
          setIsLoading(false);
        }
      }
    })();
  }, [
    isSvm,
    searchValue,
    isL1OnlyNetwork,
    account,
    total,
    currentPage,
    getMyAgents,
    getAllAgents,
    currentTab,
    isMainnet,
  ]);

  /**
   * Search (All agents, My agents)
   * - no pagination as we won't know total beforehand as we have to
   *   traverse the entire list
   */
  useEffect(() => {
    (async () => {
      if (!searchValue) return;

      setIsLoading(true);
      try {
        if (isMainnet) {
          const filteredList = await getAgentsBySearch(
            searchValue,
            currentTab === MY_AGENTS ? account : null,
          );
          setList(filteredList);
        } else {
          const filteredList = await getFilteredAgents(
            searchValue,
            currentTab === MY_AGENTS ? account : null,
          );
          setList(filteredList);
        }

        setTotal(0); // total won't be used if search is used
        setCurrentPage(1);
      } catch (e) {
        notifyError('Error fetching agents');
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [account, searchValue, currentTab, currentPage, getAgentsBySearch, isMainnet]);

  const tableCommonProps = {
    type: NAV_TYPES.AGENT_BLUEPRINTS,
    isLoading,
    total,
    currentPage,
    setCurrentPage,
    onViewClick,
    searchValue,
  };

  return (
    <PageMainContainer>
      <Title level={2}>Agent Blueprints</Title>
      <Tabs
        className="registry-tabs"
        type="card"
        activeKey={currentTab}
        tabBarExtraContent={extraTabContent}
        onChange={(tabName) => {
          setCurrentTab(tabName);

          setTotal(0);
          setCurrentPage(1);
          setIsLoading(true);

          // clear the search
          clearSearch();

          // update the links to keep track of my-agents
          router.push({
            pathname: links.AGENTS,
            query: tabName === ALL_AGENTS ? {} : { tab: tabName },
          });
        }}
        items={[
          {
            key: ALL_AGENTS,
            label: 'All',
            disabled: isLoading,
            children: (
              <ListTable {...tableCommonProps} list={list} tableDataTestId="all-agents-table" />
            ),
          },
          {
            key: MY_AGENTS,
            label: 'My Agent Blueprints',
            disabled: isLoading,
            children: (
              <ListTable
                {...tableCommonProps}
                list={list}
                isAccountRequired
                tableDataTestId="my-agents-table"
              />
            ),
          },
        ]}
      />
    </PageMainContainer>
  );
};

export default ListAgents;
