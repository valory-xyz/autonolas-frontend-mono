import { useState, useEffect } from 'react';
import { Tabs } from 'antd';
import { useRouter } from 'next/router';
import { notifyError } from '@autonolas/frontend-library';

import { NAV_TYPES } from '../../util/constants';
import {
  ListTable,
  useExtraTabContent,
  getHash,
  isMyTab,
} from '../../common-util/List/ListTable';
import { getMyListOnPagination } from '../../common-util/ContractUtils/myList';
import { useHelpers } from '../../common-util/hooks';
import {
  useAllServices,
  useMyServices,
  useSearchServices,
} from './hooks/useServicesList';
import { useServiceInfo } from './hooks/useSvmService';
import {
  getServices,
  getFilteredServices,
  getTotalForAllServices,
  getTotalForMyServices,
} from './utils';

const ALL_SERVICES = 'all-services';
const MY_SERVICES = 'my-services';

const ListServices = () => {
  const router = useRouter();
  const hash = getHash(router);
  const [currentTab, setCurrentTab] = useState(
    isMyTab(hash) ? MY_SERVICES : ALL_SERVICES,
  );

  const { account, links, isSvm, chainId, isMainnet } = useHelpers();

  const getAllServices = useAllServices();
  const getMyServices = useMyServices();
  const getServicesBySearch = useSearchServices();

  /**
   * extra tab content & view click
   */
  const { searchValue, extraTabContent, clearSearch } = useExtraTabContent({
    title: 'Services',
    onRegisterClick: () => router.push(links.MINT_SERVICE),
    isSvm,
    type: NAV_TYPES.SERVICE,
  });
  const onViewClick = (id) => router.push(`${links.SERVICES}/${id}`);

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
  }, [hash]);

  const {
    getTotalForAllSvmServices,
    getTotalForMySvmServices,
    getSvmServices,
    getMySvmServices,
  } = useServiceInfo();

  // fetch total (All services & My services)
  useEffect(() => {
    const getTotal = async () => {
      try {
        let totalTemp = null;

        if (currentTab === ALL_SERVICES) {
          totalTemp = isSvm
            ? await getTotalForAllSvmServices()
            : await getTotalForAllServices();
        } else if (currentTab === MY_SERVICES && account) {
          totalTemp = isSvm
            ? await getTotalForMySvmServices(account)
            : await getTotalForMyServices(account);
        }

        setTotal(Number(totalTemp));
        if (Number(totalTemp) === 0) {
          setIsLoading(false);
          setList([]);
        }
      } catch (e) {
        console.error(e);
        notifyError('Error fetching services');
      }
    };

    if (searchValue === '') {
      getTotal();
    }
  }, [
    account,
    currentTab,
    searchValue,
    isSvm,
    getTotalForAllSvmServices,
    getTotalForMySvmServices,
    getSvmServices,
    chainId,
  ]);

  // fetch the list (All services, My Services) - WITHOUT search
  useEffect(() => {
    const getList = async () => {
      setIsLoading(true);
      setList([]);

      try {
        // All services
        if (currentTab === ALL_SERVICES) {
          if (isMainnet) {
            const mainnetServices = await getAllServices(currentPage);
            setList(mainnetServices);
          } else {
            const nonMainnetServices = isSvm
              ? await getSvmServices(total, currentPage)
              : await getServices(total, currentPage);
            setList(nonMainnetServices);
          }
        } else if (currentTab === MY_SERVICES && account) {
          /**
           * My services
           * - search by `account` as searchValue
           * - API will be called only once & store the complete list
           */
          if (isMainnet) {
            const mainnetMyServices = await getMyServices(account, currentPage);
            setList(mainnetMyServices);
          } else {
            const nonMainnetMyServices = isSvm
              ? await getMySvmServices(account, total)
              : await getFilteredServices(account);
            setList(nonMainnetMyServices);

            // TODO: remove this once `getTotalForMySvmServices` is fixed
            if (isSvm) {
              setTotal(nonMainnetMyServices.length);
            }
          }
        }
      } catch (e) {
        console.error(e);
        notifyError('Error fetching services list');
      } finally {
        setIsLoading(false);
      }
    };

    if (total && currentPage && !searchValue) {
      getList();
    }
  }, [
    account,
    total,
    currentPage,
    currentTab,
    searchValue,
    isSvm,
    getMyServices,
    getAllServices,
    getSvmServices,
    getMySvmServices,
    isMainnet,
    chainId,
  ]);

  /**
   * fetch the list (All services, My Services) - WITH search
   * - no pagination as we won't know total beforehand as we have to
   *   traverse the entire list
   */
  useEffect(() => {
    (async () => {
      if (!searchValue) return;

      setIsLoading(true);
      setList([]);

      try {
        if (isMainnet) {
          const filteredList = await getServicesBySearch(
            searchValue,
            currentPage,
            currentTab === MY_SERVICES ? account : null,
          );
          setList(filteredList);
        } else {
          const filteredList = await getFilteredServices(
            searchValue,
            currentTab === MY_SERVICES ? account : null,
          );
          setList(filteredList);
        }

        setTotal(0); // total won't be used if search is used
        setCurrentPage(1);
      } catch (e) {
        console.error(e);
        notifyError('Error fetching services');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [
    account,
    searchValue,
    currentTab,
    currentPage,
    getServicesBySearch,
    isMainnet,
    chainId,
  ]);

  const tableCommonProps = {
    type: NAV_TYPES.SERVICE,
    isLoading,
    total,
    currentPage,
    setCurrentPage,
    onViewClick,
    searchValue,
    onUpdateClick: (serviceId) =>
      router.push(`${links.UPDATE_SERVICE}/${serviceId}`),
  };

  const getMyServiceList = () => {
    if (isMainnet) return list;

    return searchValue
      ? list
      : getMyListOnPagination({ total, nextPage: currentPage, list });
  };

  return (
    <Tabs
      className="registry-tabs"
      type="card"
      activeKey={currentTab}
      tabBarExtraContent={extraTabContent}
      onChange={(activeTab) => {
        setCurrentTab(activeTab);

        setTotal(0);
        setCurrentPage(1);
        setIsLoading(true);

        // clear the search
        clearSearch();

        // update the URL to keep track of my-services
        router.push(
          activeTab === MY_SERVICES
            ? `${links.SERVICES}#${MY_SERVICES}`
            : links.SERVICES,
        );
      }}
      items={[
        {
          key: ALL_SERVICES,
          label: 'All',
          disabled: isLoading,
          children: (
            <ListTable
              {...tableCommonProps}
              list={list}
              tableDataTestId="all-services-table"
            />
          ),
        },
        {
          key: MY_SERVICES,
          label: 'My Services',
          disabled: isLoading,
          children: (
            <ListTable
              {...tableCommonProps}
              list={getMyServiceList()}
              isPaginationRequired={!isSvm}
              isAccountRequired
              tableDataTestId="all-services-table"
            />
          ),
        },
      ]}
    />
  );
};

export default ListServices;
