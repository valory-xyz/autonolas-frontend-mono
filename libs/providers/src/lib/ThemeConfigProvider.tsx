import { ConfigProvider as AntdConfigProvider, ThemeConfig as AntdThemeConfig } from 'antd';
import { PropsWithChildren, useEffect, useState } from 'react';

/**
 * Replaces standard Antd ConfigProvider,
 * without it styles are not applied correctly on load
 */
import React from 'react';

export const ThemeConfigProvider = ({ children, theme }: PropsWithChildren & {theme?: AntdThemeConfig}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <AntdConfigProvider theme={theme}>
      {isMounted ? children : ''}
    </AntdConfigProvider>
  );
};
