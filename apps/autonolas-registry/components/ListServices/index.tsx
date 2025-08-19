import { Tabs } from 'antd';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { notifyError } from '@autonolas/frontend-library';

import { getMyListOnPagination } from '../../common-util/ContractUtils/myList';
import { ListTable, isMyTab, useExtraTabContent } from '../../common-util/List/ListTable';
import { useHelpers } from '../../common-util/hooks';
import { NAV_TYPES } from '../../util/constants';
import { useAllServices, useMyServices, useSearchServices } from './hooks/useServicesList';
import { useServiceInfo } from './hooks/useSvmService';
import {
  getFilteredServices,
  getServices,
  getTotalForAllServices,
  getTotalForMyServices,
} from './utils';

const ALL_AI_AGENTS = 'all-ai-agents';
const MY_AI_AGENTS = 'my-ai-agents';

type AI_AGENT = {
  id: string;
  description: string;
  metadata: string;
  configHash: string;
  role: string;
};

const ListServices = () => {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState<string>(
    isMyTab(router) ? MY_AI_AGENTS : ALL_AI_AGENTS,
  );

  const { account, links, isSvm, chainId, isMainnet } = useHelpers();

  const getAllServices = useAllServices();
  const getMyServices = useMyServices();
  const getServicesBySearch = useSearchServices();

  /**
   * extra tab content & view click
   */
  const { searchValue, clearSearch } = useExtraTabContent({
    title: 'AI Agents',
    onRegisterClick: () => router.push(links.MINT_SERVICE),
    isSvm,
    isMyTab: currentTab === MY_AI_AGENTS,
    type: NAV_TYPES.SERVICE,
  });

  const onViewClick = (id: string) => router.push(`${links.SERVICES}/${id}`);

  /**
   * filtered list
   */
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [list, setList] = useState<AI_AGENT[]>([]);

  const { getTotalForAllSvmServices, getTotalForMySvmServices, getSvmServices, getMySvmServices } =
    useServiceInfo();

  // fetch total (All services & My services)
  useEffect(() => {
    const getTotal = async () => {
      try {
        let totalTemp = null;

        if (currentTab === ALL_AI_AGENTS) {
          totalTemp = isSvm ? await getTotalForAllSvmServices() : await getTotalForAllServices();
        } else if (currentTab === MY_AI_AGENTS && account) {
          totalTemp = isSvm
            ? // TODO: add logic to filter basis the account
              await getTotalForMySvmServices()
            : await getTotalForMyServices(account);
        }

        setTotal(Number(totalTemp));
        if (Number(totalTemp) === 0) {
          setIsLoading(false);
          setList([]);
        }
      } catch (e) {
        notifyError('Error fetching services');
        console.error(e);
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

      try {
        // All services
        if (currentTab === ALL_AI_AGENTS) {
          if (isMainnet) {
            const mainnetServices = await getAllServices(currentPage);
            setList(mainnetServices);
          } else {
            const nonMainnetServices = isSvm
              ? await getSvmServices(total, currentPage)
              : await getServices(total, currentPage);

            console.log(nonMainnetServices);
            setList(nonMainnetServices);
          }
        } else if (currentTab === MY_AI_AGENTS && account) {
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
              : await getFilteredServices(searchValue, account);
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
    // getSvmServices,
    // getMySvmServices,
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
            currentTab === MY_AI_AGENTS ? account : null,
          );
          setList(filteredList);
        } else {
          const filteredList = await getFilteredServices(
            searchValue,
            currentTab === MY_AI_AGENTS && account ? account : '',
          );
          setList(filteredList);
        }

        setTotal(0); // total won't be used if search is used
        setCurrentPage(1);
      } catch (e) {
        notifyError('Error fetching services');
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [account, searchValue, currentTab, currentPage, getServicesBySearch, isMainnet, chainId]);

  const tableCommonProps = {
    type: NAV_TYPES.SERVICE,
    isLoading,
    total,
    currentPage,
    setCurrentPage,
    onViewClick,
    searchValue,
    onUpdateClick: (serviceId: string) => router.push(`${links.UPDATE_SERVICE}/${serviceId}`),
  };

  const getMyServiceList = () => {
    if (isMainnet) return list;

    // @ts-expect-error TODO
    return searchValue ? list : getMyListOnPagination({ total, nextPage: currentPage, list });
  };

  return (
    <Tabs
      className="registry-tabs"
      type="card"
      activeKey={currentTab}
      // tabBarExtraContent={extraTabContent}
      onChange={(tabName) => {
        setCurrentTab(tabName);

        setTotal(0);
        setCurrentPage(1);
        setIsLoading(true);

        // clear the search
        clearSearch();

        // update the URL to keep track of my-services
        router.push({
          pathname: links.SERVICES,
          query: tabName === ALL_AI_AGENTS ? {} : { tab: tabName },
        });
      }}
      items={[
        {
          key: ALL_AI_AGENTS,
          label: 'All',
          disabled: isLoading,
          children: (
            <ListTable {...tableCommonProps} list={list} tableDataTestId="all-services-table" />
          ),
        },
        {
          key: MY_AI_AGENTS,
          label: 'My AI Agents',
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
