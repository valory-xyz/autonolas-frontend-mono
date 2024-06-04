import { ConfigProvider as AntdConfigProvider, ConfigProviderProps, ThemeConfig } from 'antd';
import { useEffect, useState } from 'react';

import { COLOR } from './ui-theme';

export const THEME_CONFIG: ThemeConfig = {
  token: {
    colorPrimary: COLOR.PRIMARY,
    colorBgBase: COLOR.WHITE,
    colorLink: COLOR.PRIMARY,
    colorTextPlaceholder: COLOR.GREY_2,
    colorText: COLOR.TEXT_PRIMARY,
    colorTextDescription: COLOR.TEXT_SECONDARY,
    fontSize: 18,
    borderRadius: 5,
    controlHeight: 42,
  },
  components: {
    Anchor: {
      linkPaddingBlock: 8,
    },
    Layout: {
      headerBg: COLOR.WHITE,
      bodyBg: COLOR.WHITE,
    },
    Tabs: {
      motionDurationMid: '0.1s',
      motionDurationSlow: '0.1s',
    },
    Table: {
      padding: 12,
      fontWeightStrong: 500,
    },
    Alert: {
      colorInfoBg: COLOR.ANT_PRIMARY_BG,
      colorInfoBorder: COLOR.ANT_PRIMARY_BORDER,
      colorInfo: COLOR.PRIMARY /** info icon */,
    },
  },
};

/**
 * Use this provider in place of the `ConfigProvider` from `antd` to
 * ensure that the theme is only applied once the component has mounted.
 * @param props The props to pass to the `ConfigProvider`.
 */
export const AutonolasThemeProvider = ({ theme = THEME_CONFIG, children }: ConfigProviderProps) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return <AntdConfigProvider theme={theme}>{isMounted ? children : ''}</AntdConfigProvider>;
};
