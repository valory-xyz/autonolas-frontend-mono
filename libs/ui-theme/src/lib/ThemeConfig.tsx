import { ConfigProvider, ConfigProviderProps, ThemeConfig } from 'antd';
import { useEffect, useState } from 'react';

import { COLOR } from './ui-theme';

export const THEME_CONFIG: ThemeConfig = {
  token: {
    colorPrimary: COLOR.PRIMARY,
    colorBgBase: COLOR.WHITE,
    colorLink: COLOR.PRIMARY,
    colorTextPlaceholder: COLOR.GREY_2,
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
export const AutonolasThemeProvider = ({ theme = THEME_CONFIG, ...rest }: ConfigProviderProps) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted ? <ConfigProvider theme={theme} {...rest} /> : null;
};
