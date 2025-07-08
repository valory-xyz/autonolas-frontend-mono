import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

import paths from 'components/Paths/data.json';
import { SITE } from 'util/constants';

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
  const [pathData, setPathData] = useState<PathData>(null);
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    const fetchPathData = async () => {
      try {
        setLoading(true);
        const pathDetails = paths.find((path) => path.id === id);

        if (!pathDetails) {
          setPathData(null);
          setMarkdownContent('');
          setLoading(false);
          return;
        }

        setPathData(pathDetails);

        // Fetch markdown content
        const response = await fetch(`/${pathDetails.markdownPath}`);

        if (response.ok) {
          const content = await response.text();
          setMarkdownContent(content);
        } else {
          setMarkdownContent('');
        }
      } catch (error) {
        console.error('Error fetching path data:', error);
        setPathData(null);
        setMarkdownContent('');
      } finally {
        setLoading(false);
      }
    };

    fetchPathData();
  }, [id]);

  return { pathData, loading, markdownContent };
};
