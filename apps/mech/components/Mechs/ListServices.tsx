import { Flex, Segmented } from 'antd';
import get from 'lodash/get';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import type { RootState } from 'store/types';
import { useSearchInput } from 'common-util/hooks';
import ListTable from 'components/List/ListTable';
import { getHash, isMyTab } from 'components/List/ListTable/helpers';
import { MarketplaceRequest } from 'components/Request/Request';
import { NAV_TYPES, URL } from 'util/constants';

import { getMechs, getTotalMechs, type MechInfo } from './utils';

const ALL_SERVICES = 'all-services';
const MY_SERVICES = 'my-services';

const MAX_TOTAL = 1000;
const DEFAULT_CURRENT_PAGE = 1;

export const ListServices = () => {
  const router = useRouter();
  const hash = getHash(router);
  const [currentTab, setCurrentTab] = useState(isMyTab(hash) ? MY_SERVICES : ALL_SERVICES);
  const networkNameFromUrl = router?.query?.network;

  const account = useSelector((state: RootState) => get(state, 'setup.account'));

  /**
   * extra tab content & view click
   */
  const { searchValue, searchInput, clearSearch } = useSearchInput();

  /**
   * filtered list
   */
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(DEFAULT_CURRENT_PAGE);
  const [list, setList] = useState<MechInfo[]>([]);

  // update current tab based on the "hash" in the URL
  useEffect(() => {
    setCurrentTab(isMyTab(hash) ? MY_SERVICES : ALL_SERVICES);
    setList([]);
  }, [hash]);

  // fetch total
  useEffect(() => {
    (async () => {
      try {
        if (currentTab === ALL_SERVICES && !searchValue && isLoading) {
          const totalMechs = await getTotalMechs();
          setTotal(totalMechs);

          if (totalMechs === 0) {
            setIsLoading(false);
          }
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [networkNameFromUrl, account, currentTab, searchValue, isLoading]);

  // fetch the list
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        if (currentTab === MY_SERVICES && !account) {
          setList([]);
          return;
        }

        if (currentTab === ALL_SERVICES && !searchValue && total) {
          // get mechs without search
          setList([]);
          /**
           * The fetcher fn skips values based on the currentPage value, which in turn
           * only gets items < total number of Items.
           * Hence passing the actual current page value would break the pagination logic.
           *
           * TODO: if we fix the implementation for the `total` items, we can fill
           * dummy values in the array.
           */
          const mechs = await getMechs(total, DEFAULT_CURRENT_PAGE);
          setList(mechs);
        } else {
          // get my mechs or mechs with search
          const filters: { owner?: string; searchValue?: string } = {};
          if (currentTab === MY_SERVICES && account) {
            filters.owner = account;
          }
          if (searchValue) {
            filters.searchValue = searchValue;
          }
          // request maximum amount as pagination is not supported with search
          const mechs = await getMechs(MAX_TOTAL, DEFAULT_CURRENT_PAGE, filters);
          setList(mechs);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [networkNameFromUrl, account, currentTab, searchValue, total]);

  const tableCommonProps = {
    type: NAV_TYPES.SERVICE,
    isLoading,
    // `total` from the graphql API is incorrect, hence relying on the list length
    total: list.length,
    currentPage,
    setCurrentPage,
    isPaginationRequired: currentTab === ALL_SERVICES && !searchValue,
    isAccountRequired: currentTab === MY_SERVICES && !account,
    extra: { scrollX: 1100 },
  };

  return (
    <Flex vertical gap={24}>
      <Flex gap={8} justify="end">
        <Segmented
          options={[
            { value: ALL_SERVICES, label: 'All services' },
            { value: MY_SERVICES, label: 'My services' },
          ]}
          value={currentTab}
          size="large"
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
              `/${networkNameFromUrl}/${e === MY_SERVICES ? `${URL.MECHS}#${MY_SERVICES}` : URL.MECHS}`,
            );
          }}
        />
        {searchInput}
      </Flex>

      <MarketplaceRequest mechAddresses={list.map((item) => item.address)} />
      <ListTable {...tableCommonProps} list={list} />
    </Flex>
  );
};
