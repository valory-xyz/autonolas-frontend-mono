import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";

const DEFAULT_PAGE = 1;

export const usePaginationParams = () => {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(DEFAULT_PAGE);

  const getInitialPage = useCallback(() => {
    const pageParam = router.query.page;

    if (typeof pageParam !== "string") {
      return DEFAULT_PAGE;
    }

    const parsed = parseInt(pageParam, 10);

    if (isNaN(parsed) || parsed < 1) {
      return DEFAULT_PAGE;
    }

    return parsed;
  }, [router.query.page]);

  const updatePage = useCallback(
    (page: number) => {
      setCurrentPage(page);

      const newQuery = { ...router.query };

      if (page === DEFAULT_PAGE) {
        delete newQuery.page;
      } else {
        newQuery.page = String(page);
      }

      router.push({ pathname: router.pathname, query: newQuery }, undefined, {
        shallow: true,
      });
    },
    [router],
  );

  const resetPage = useCallback(() => {
    updatePage(DEFAULT_PAGE);
  }, [updatePage]);

  useEffect(() => {
    if (router.isReady) {
      setCurrentPage(getInitialPage());
    }
  }, [router.isReady, getInitialPage]);

  // Reset page when network changes
  useEffect(() => {
    if (router.isReady && router.query.page) {
      resetPage();
    }
  }, [router.query.network]);

  return { currentPage, setCurrentPage: updatePage, resetPage };
};
