import { ConfigProvider as AntdConfigProvider, ConfigProviderProps, ThemeConfig } from 'antd';
import { useEffect, useState } from 'react';

import { BORDER_RADIUS, COLOR } from './ui-theme';

export const THEME_CONFIG: ThemeConfig = {
  token: {
    wireframe: false,
    colorPrimary: COLOR.PRIMARY,
    colorInfo: '#1677ff',
    colorSuccessHover: '#73d13d',
    colorWarning: '#fa8c16',
    colorWarningHover: '#ffa940',
    colorError: '#f5222d',
    colorLink: COLOR.PRIMARY,
    colorInfoHover: '#4096ff',
    colorText: '#1f2229',
    colorTextSecondary: COLOR.SECONDARY,
    colorTextTertiary: '#606f85',
    colorTextQuaternary: '#a3aebb',
    colorBorder: COLOR.BORDER_GREY,
    colorBorderSecondary: COLOR.BORDER_GREY_2,
    colorFill: '#0b1e4126',
    colorFillSecondary: '#0b1e410f',
    colorFillTertiary: '#0b1e410a',
    colorFillQuaternary: '#f2f4f9',
    colorBgLayout: '#f2f4f9',
    colorBgSpotlight: '#132039d9',
    colorBgMask: '#1b263233',
    borderRadius: BORDER_RADIUS,
    borderRadiusXS: 4,
    borderRadiusLG: BORDER_RADIUS,
    boxShadow:
      '0px 1px 2px 0px rgba(0, 0, 0, 0.03), 0px 1px 6px -1px rgba(0, 0, 0, 0.02), 0px 2px 4px 0px rgba(0, 0, 0, 0.02)',
    boxShadowSecondary:
      '0px -4px 8px 2px rgba(24, 39, 75, 0.06), 0px 4px 8px 2px rgba(24, 39, 75, 0.12), 0px 1px 3px 0px rgba(24, 39, 75, 0.06)',
    colorSuccessTextHover: '#237804',
    colorSuccessText: '#135200',
    colorSuccessTextActive: '#092b00',
    colorWarningTextHover: '#ad4e00',
    colorWarningText: '#873800',
    colorWarningTextActive: '#612500',
    colorErrorTextHover: '#cf1322',
    colorErrorText: '#a8071a',
    colorErrorTextActive: '#820014',
    colorInfoTextHover: '#0958d9',
    colorInfoText: '#003eb3',
    colorInfoTextActive: '#002c8c',
    colorTextBase: '#1f2229',
    fontSize: 16,
  },
  components: {
    Table: {
      headerFilterHoverBg: COLOR.BORDER_GREY_2,
      borderColor: COLOR.BORDER_GREY_2,
      bodySortBg: '#f2f4f9',
      footerBg: '#f2f4f9',
      headerColor: '#4d596a',
      headerSortActiveBg: COLOR.BORDER_GREY_2,
      headerSortHoverBg: '#c2cbd7',
      headerSplitColor: COLOR.BORDER_GREY_2,
      rowSelectedBg: '#faf0ff',
      rowSelectedHoverBg: '#efcfff',
    },
    Alert: {
      borderRadiusLG: 8,
    },
    Layout: {
      headerBg: COLOR.WHITE,
    },
    Button: {
      contentFontSizeLG: 16,
    },
    Input: {
      paddingBlock: 8,
      paddingInline: 12,
    },
    InputNumber: {
      paddingBlock: 8,
      paddingInline: 12,
    },
    List: {
      colorBorder: COLOR.BORDER_GREY_2,
    },
    Collapse: {
      colorBorder: COLOR.BORDER_GREY_2,
    },
    Modal: {
      titleFontSize: 24,
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
