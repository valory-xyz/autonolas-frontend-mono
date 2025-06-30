import { Flex, Segmented } from 'antd';
import get from 'lodash/get';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { getMyListOnPagination } from 'common-util/ContractUtils/myList';
import { useSearchInput, useUnsupportedNetwork } from 'common-util/hooks';
import ListTable from 'components/List/ListTable';
import { getHash, isMyTab } from 'components/List/ListTable/helpers';
import { NAV_TYPES, URL } from 'util/constants';

import { getAgents, getFilteredAgents, getTotalForAllAgents, getTotalForMyAgents } from './utils';

const ALL_AGENTS = 'all-agents';
const MY_AGENTS = 'my-agents';

export const ListAgents = () => {
  const router = useRouter();
  const hash = getHash(router);
  const [currentTab, setCurrentTab] = useState(isMyTab(hash) ? MY_AGENTS : ALL_AGENTS);
  const networkNameFromUrl = router?.query?.network;

  const account = useSelector((state) => get(state, 'setup.account'));

  const { isWrongNetwork, wrongNetworkContent } = useUnsupportedNetwork();

  /**
   * extra tab content & view click
   */
  const { searchValue, searchInput, clearSearch } = useSearchInput({
    title: '',
  });

  /**
   * filtered list
   */
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [list, setList] = useState([]);

  // update current tab based on the "hash" in the URL
  useEffect(() => {
    setCurrentTab(isMyTab(hash) ? MY_AGENTS : ALL_AGENTS);
    setList([]);
  }, [router.asPath]);

  // fetch total
  useEffect(() => {
    (async () => {
      if (searchValue === '') {
        try {
          let totalTemp = null;

          // All agents
          if (currentTab === ALL_AGENTS) {
            totalTemp = await getTotalForAllAgents();
          }

          // My agents
          if (currentTab === MY_AGENTS) {
            totalTemp = await getTotalForMyAgents(account);
          }

          setTotal(Number(totalTemp));
          if (Number(totalTemp) === 0) {
            setIsLoading(false);
          }
        } catch (e) {
          console.error(e);
        }
      }
    })();
  }, [account, currentTab, searchValue]);

  // fetch the list (without search)
  useEffect(() => {
    (async () => {
      if (total && currentPage && !searchValue) {
        setIsLoading(true);

        try {
          // All agents
          if (currentTab === ALL_AGENTS) {
            setList([]);
            const everyComps = await getAgents(total, currentPage);
            setList(everyComps);
          }

          /**
           * My agents
           * - search by `account` as searchValue
           * - API will be called only once & store the complete list
           */
          if (currentTab === MY_AGENTS && list.length === 0) {
            const e = await getFilteredAgents(account);
            setList(e);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsLoading(false);
        }
      }
    })();
  }, [account, total, currentPage]);

  /**
   * Search (All agents, My agents)
   * - no pagination as we won't know total beforehand as we have to
   *   traverse the entire list
   */
  useEffect(() => {
    (async () => {
      if (searchValue) {
        setIsLoading(true);
        setList([]);

        try {
          const filteredList = await getFilteredAgents(
            searchValue,
            currentTab === MY_AGENTS ? account : null,
          );
          setList(filteredList);
          setTotal(0); // total won't be used if search is used
          setCurrentPage(1);
        } catch (e) {
          console.error(e);
        } finally {
          setIsLoading(false);
        }
      }
    })();
  }, [account, searchValue]);

  const tableCommonProps = {
    type: NAV_TYPES.AGENT,
    isLoading,
    total,
    currentPage,
    setCurrentPage,
    isPaginationRequired: currentTab === ALL_AGENTS && !searchValue,
  };

  if (isWrongNetwork) {
    return wrongNetworkContent;
  }

  return (
    <Flex vertical gap={24}>
      <Flex gap={8} justify="end">
        <Segmented
          size="large"
          options={[
            { value: ALL_AGENTS, label: 'All agents' },
            { value: MY_AGENTS, label: 'My agents' },
          ]}
          value={currentTab}
          onChange={(e) => {
            setCurrentTab(e);

            setList([]);
            setTotal(0);
            setCurrentPage(1);
            setIsLoading(true);

            // clear the search
            clearSearch();
            // update the URL to keep track of my-agents
            router.push(
              `/${networkNameFromUrl}/${e === MY_AGENTS ? `${URL.MECHS_LEGACY}#${MY_AGENTS}` : URL.MECHS_LEGACY}`,
            );
          }}
        />
        {searchInput}
      </Flex>

      {currentTab === ALL_AGENTS && <ListTable {...tableCommonProps} list={list} />}
      {currentTab === MY_AGENTS && (
        <ListTable
          {...tableCommonProps}
          list={
            searchValue
              ? list
              : getMyListOnPagination({
                  total,
                  nextPage: currentPage,
                  list,
                })
          }
          isAccountRequired={!account}
        />
      )}
    </Flex>
  );
};
