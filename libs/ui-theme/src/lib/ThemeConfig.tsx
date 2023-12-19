import React, { ReactNode } from 'react';
import { ConfigProvider, ThemeConfig } from 'antd';
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

export const AutonolasThemeProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  return <ConfigProvider theme={THEME_CONFIG}>{children}</ConfigProvider>;
};
