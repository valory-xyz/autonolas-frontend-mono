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
import {
  useAllComponents,
  useMyComponents,
  useSearchComponents,
} from './useComponents';
import {
  getComponents,
  getFilteredComponents,
  getTotalForAllComponents,
  getTotalForMyComponents,
} from './utils';

const ALL_COMPONENTS = 'all-components';
const MY_COMPONENTS = 'my-components';

const ListComponents = () => {
  const router = useRouter();
  const hash = getHash(router);
  const [currentTab, setCurrentTab] = useState(
    isMyTab(hash) ? MY_COMPONENTS : ALL_COMPONENTS,
  );

  const { account, chainId, links, isL1OnlyNetwork, isSvm } = useHelpers();

  const getAllComponents = useAllComponents();
  const getMyComponents = useMyComponents();
  const getComponentsBySearch = useSearchComponents();

  /**
   * extra tab content & view click
   */
  const { searchValue, extraTabContent, clearSearch } = useExtraTabContent({
    title: 'Components',
    onRegisterClick: () => router.push(links.MINT_COMPONENT),
  });
  const onViewClick = (id) => router.push(`${links.COMPONENTS}/${id}`);

  /**
   * filtered list
   */
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [list, setList] = useState([]);

  // update current tab based on the "hash" in the URL
  useEffect(() => {
    setCurrentTab(isMyTab(hash) ? MY_COMPONENTS : ALL_COMPONENTS);
  }, [router.asPath, hash]);

  // fetch total
  useEffect(() => {
    (async () => {
      if (isSvm) return;
      if (!isL1OnlyNetwork) return;
      if (searchValue !== '') return;

      try {
        let totalTemp = null;
        if (currentTab === ALL_COMPONENTS) {
          totalTemp = await getTotalForAllComponents();
        } else if (currentTab === MY_COMPONENTS && account) {
          totalTemp = await getTotalForMyComponents(account);
        }

        setTotal(Number(totalTemp));
        if (Number(totalTemp) === 0) {
          setIsLoading(false);
        }
      } catch (e) {
        console.error(e);
        notifyError('Error fetching components');
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
          // All components
          if (currentTab === ALL_COMPONENTS) {
            const everyComps =
              chainId === 1
                ? await getAllComponents(currentPage)
                : await getComponents(total, currentPage);
            setList(everyComps);
          } else if (currentTab === MY_COMPONENTS && account) {
            /**
             * My components
             * - search by `account` as searchValue
             * - API will be called only once & store the complete list
             */
            const e =
              chainId === 1
                ? await getMyComponents(account, currentPage)
                : await getFilteredComponents(account);
            setList(e);
          }
        } catch (e) {
          console.error(e);
          notifyError('Error fetching components');
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
    chainId,
    total,
    currentPage,
    getMyComponents,
    getAllComponents,
    currentTab,
  ]);

  /**
   * Search (All components, My Components)
   * - no pagination as we won't know total beforehand as we have to
   *   traverse the entire list
   */
  useEffect(() => {
    (async () => {
      if (!searchValue) return;

      setIsLoading(true);
      try {
        if (chainId === 1) {
          const filteredList = await getComponentsBySearch(
            searchValue,
            currentTab === MY_COMPONENTS ? account : null,
          );
          setList(filteredList);
        } else {
          const filteredList = await getFilteredComponents(
            searchValue,
            currentTab === MY_COMPONENTS ? account : null,
          );
          setList(filteredList);
        }
        setTotal(0); // total won't be used if search is used
        setCurrentPage(1);
      } catch (e) {
        console.error(e);
        notifyError('Error fetching components');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [
    account,
    chainId,
    searchValue,
    currentTab,
    currentPage,
    getComponentsBySearch,
  ]);

  const tableCommonProps = {
    type: NAV_TYPES.COMPONENT,
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

        // update the URL to keep track of my-components
        router.push(
          e === MY_COMPONENTS
            ? `${links.COMPONENTS}#${MY_COMPONENTS}`
            : links.COMPONENTS,
        );
      }}
      items={[
        {
          key: ALL_COMPONENTS,
          label: 'All',
          children: (
            <ListTable
              {...tableCommonProps}
              list={list}
              tableDataTestId="all-components-table"
            />
          ),
        },
        {
          label: 'My Components',
          key: MY_COMPONENTS,
          children: (
            <ListTable
              {...tableCommonProps}
              list={list}
              isAccountRequired
              tableDataTestId="my-components-table"
            />
          ),
        },
      ]}
    />
  );
};

export default ListComponents;
