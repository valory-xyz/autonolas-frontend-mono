import { useState, useEffect } from 'react';
import { Tabs } from 'antd';
import { useRouter } from 'next/router';
import { notifyError } from '@autonolas/frontend-library';

import { NAV_TYPES } from '../../util/constants';
import ListTable from '../../common-util/List/ListTable';
import {
  useExtraTabContent,
  getHash,
  isMyTab,
} from '../../common-util/List/ListTable/helpers';
import { useHelpers } from '../../common-util/hooks';
import { useAllAgents, useMyAgents, useSearchAgents } from './useAgents';
import {
  getAgents,
  getFilteredAgents,
  getTotalForAllAgents,
  getTotalForMyAgents,
} from './utils';

const ALL_AGENTS = 'all-agents';
const MY_AGENTS = 'my-agents';

const ListAgents = () => {
  const router = useRouter();
  const hash = getHash(router);
  const [currentTab, setCurrentTab] = useState(
    isMyTab(hash) ? MY_AGENTS : ALL_AGENTS,
  );

  const { account, chainId, links, isL1OnlyNetwork, isSvm, isMainnet } =
    useHelpers();

  const getAllAgents = useAllAgents();
  const getMyAgents = useMyAgents();
  const getAgentsBySearch = useSearchAgents();

  /**
   * extra tab content & view click
   */
  const { searchValue, extraTabContent, clearSearch } = useExtraTabContent({
    title: 'Agents',
    onRegisterClick: () => router.push(links.MINT_AGENT),
  });
  const onViewClick = (id) => router.push(`${links.AGENTS}/${id}`);

  /**
   * filtered list
   */
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [list, setList] = useState([]);

  // update current tab based on the "hash" in the links
  useEffect(() => {
    setCurrentTab(isMyTab(hash) ? MY_AGENTS : ALL_AGENTS);
  }, [router.asPath, hash]);

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
        }
      } catch (e) {
        console.error(e);
        notifyError('Error fetching agents');
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
            const e = isMainnet
              ? await getMyAgents(account, currentPage)
              : await getFilteredAgents(account);
            setList(e);
          }
        } catch (e) {
          console.error(e);
          notifyError('Error fetching agents');
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
        console.error(e);
        notifyError('Error fetching agents');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [
    account,
    searchValue,
    currentTab,
    currentPage,
    getAgentsBySearch,
    isMainnet,
  ]);

  const tableCommonProps = {
    type: NAV_TYPES.AGENT,
    isLoading,
    total,
    currentPage,
    setCurrentPage,
    onViewClick,
    searchValue,
  };

  return (
    <Tabs
      className="registry-tabs"
      type="card"
      activeKey={currentTab}
      tabBarExtraContent={extraTabContent}
      onChange={(e) => {
        setCurrentTab(e);

        setTotal(0);
        setCurrentPage(1);
        setIsLoading(true);

        // clear the search
        clearSearch();

        // update the links to keep track of my-agents
        router.push(
          e === MY_AGENTS ? `${links.AGENTS}#${MY_AGENTS}` : links.AGENTS,
        );
      }}
      items={[
        {
          key: ALL_AGENTS,
          label: 'All',
          children: (
            <ListTable
              {...tableCommonProps}
              list={list}
              tableDataTestId="all-agents-table"
            />
          ),
        },
        {
          key: MY_AGENTS,
          label: 'My Agents',
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
  );
};

export default ListAgents;
