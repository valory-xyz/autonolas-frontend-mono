import { useRouter } from 'next/router';
import { useState, useEffect, useMemo } from 'react';

import paths from 'components/Paths/data.json';

type PathData = {
  id: string;
  name: string;
  description: string;
  images?: {
    homepageCard?: string;
    description?: string;
    service?: string;
    homepageCardImageCanContain?: boolean;
  };
  service?: {
    id?: string;
    name: string;
    url: string;
  };
  isMechsToolPath: boolean;
  markdownPath: string;
} | null;

export const useFetchPathData = () => {
  const router = useRouter();
  const { id } = router.query;

  // Resolve the path entry synchronously so the title/description are available
  // during SSR (the route param is present server-side via _app's getInitialProps).
  // This ensures crawlers receive per-path meta tags instead of the default ones.
  const pathData = useMemo<PathData>(() => {
    if (!id || typeof id !== 'string') return null;
    return paths.find((path) => path.id === id) ?? null;
  }, [id]);

  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    if (!pathData) {
      setMarkdownContent('');
      setLoading(false);
      return;
    }

    const fetchMarkdown = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/${pathData.markdownPath}`);
        setMarkdownContent(response.ok ? await response.text() : '');
      } catch (error) {
        console.error('Error fetching path data:', error);
        setMarkdownContent('');
      } finally {
        setLoading(false);
      }
    };

    fetchMarkdown();
  }, [id, pathData]);

  return { pathData, loading, markdownContent };
};
