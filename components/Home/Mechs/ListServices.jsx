import { Flex, Segmented } from 'antd';
import get from 'lodash/get';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import ListTable from 'common-util/List/ListTable';
import { getHash, isMyTab, useSearchInput } from 'common-util/List/ListTable/helpers';
import { NAV_TYPES, URL } from 'util/constants';

import { getMechs, getTotalMechs } from './utils';

const ALL_SERVICES = 'all-services';
const MY_SERVICES = 'my-services';

const MAX_TOTAL = 1000;

export const ListServices = () => {
  const router = useRouter();
  const hash = getHash(router);
  const [currentTab, setCurrentTab] = useState(isMyTab(hash) ? MY_SERVICES : ALL_SERVICES);
  const networkNameFromUrl = router?.query?.network;

  const account = useSelector((state) => get(state, 'setup.account'));

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
    setCurrentTab(isMyTab(hash) ? MY_SERVICES : ALL_SERVICES);
    setList([]);
  }, [router.asPath]);

  // fetch total
  useEffect(() => {
    (async () => {
      try {
        if (currentTab === ALL_SERVICES && !searchValue && isLoading) {
          const totalMechs = await getTotalMechs();

          setTotal(Number(totalMechs));
          if (Number(totalMechs) === 0) {
            setIsLoading(false);
          }
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [account, currentTab, searchValue, isLoading]);

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
          const everyComps = await getMechs(total, currentPage);
          setList(everyComps);
        } else {
          // get my mechs or mechs with search
          const filters = {};
          if (currentTab === MY_SERVICES && account) {
            filters.owner = account;
          }
          if (searchValue) {
            filters.searchValue = searchValue;
          }
          // request maximum amount as pagination is not supported with search
          const everyComps = await getMechs(MAX_TOTAL, currentPage, filters);
          setList(everyComps);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [account, currentTab, searchValue, total, currentPage]);

  const tableCommonProps = {
    type: NAV_TYPES.SERVICE,
    isLoading,
    total,
    currentPage,
    setCurrentPage,
    isPaginationRequired: currentTab === ALL_SERVICES && !searchValue,
    isAccountRequired: currentTab === MY_SERVICES && !account,
    extra: { scrollX: 1650 },
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

      <ListTable {...tableCommonProps} list={list} />
    </Flex>
  );
};
