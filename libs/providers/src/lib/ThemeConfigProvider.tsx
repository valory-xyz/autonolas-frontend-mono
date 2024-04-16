import { ConfigProvider, ConfigProviderProps } from 'antd';
import React, { useEffect, useRef } from 'react';

/**
 * Use this provider in place of the `ConfigProvider` from `antd` to 
 * ensure that the theme is only applied once the component has mounted.
 * @param props The props to pass to the `ConfigProvider`.
 */
export const ThemeConfigProvider = (
  props: ConfigProviderProps,
) => {
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return isMounted.current ? <ConfigProvider {...props} /> : null;
};
