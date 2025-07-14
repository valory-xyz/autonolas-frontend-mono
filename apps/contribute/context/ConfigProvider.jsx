import { ConfigProvider as AntdConfigProvider } from 'antd';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';

import { COLOR } from '@autonolas/frontend-library';

// Copy-pasted from mono repo. Can be removed once the app is migrated
const THEME_CONFIG = {
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
    colorTextSecondary: '#4d596a',
    colorTextTertiary: '#606f85',
    colorTextQuaternary: '#a3aebb',
    colorBorder: COLOR.BORDER_GREY,
    colorBorderSecondary: '#dfe5ee',
    colorFill: '#0b1e4126',
    colorFillSecondary: '#0b1e410f',
    colorFillTertiary: '#0b1e410a',
    colorFillQuaternary: '#f2f4f9',
    colorBgLayout: '#f2f4f9',
    colorBgSpotlight: '#132039d9',
    colorBgMask: '#1b263233',
    borderRadius: 8,
    borderRadiusXS: 4,
    borderRadiusLG: 8,
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
      headerFilterHoverBg: '#dfe5ee',
      borderColor: '#dfe5ee',
      bodySortBg: '#f2f4f9',
      footerBg: '#f2f4f9',
      headerColor: '#4d596a',
      headerSortActiveBg: '#dfe5ee',
      headerSortHoverBg: '#c2cbd7',
      headerSplitColor: '#dfe5ee',
      rowSelectedBg: '#FAF0FF',
      rowExpandedBg: COLOR.WHITE,
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
      colorBorder: '#dfe5ee',
    },
    Collapse: {
      colorBorder: '#dfe5ee',
    },
    Modal: {
      titleFontSize: 24,
    },
  },
};

export const ThemeConfigProvider = ({ children }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return <AntdConfigProvider theme={THEME_CONFIG}>{isMounted ? children : ''}</AntdConfigProvider>;
};

ThemeConfigProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
