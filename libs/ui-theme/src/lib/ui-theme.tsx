// TODO: move to theme
export const COLOR = {
  PRIMARY: '#7A00F4',
  RED: '#EA3324',
  WHITE: '#FFFFFF',
  ORANGE: ' #FF9400',

  GREEN_1: '#00FC82',
  GREEN_2: '#00F422',
  GREEN_3: '#33FF00',
  GREEN_4: '#52C41A',

  GREY_1: '#C4C4C4',
  GREY_2: '#9A9A9A',
  GREY_3: '#f0f0f0',
  GREY_4: '#C6C6C6',
  BORDER_GREY: '#E3E3E3',
  BORDER_GREY_2: '#D7DDEA',

  BLACK: '#000000',
  TABLE_BLACK: '#1B1B1B',

  // colors used by Ant Design
  ANT_PRIMARY_BG: '#F7E6FF',
  ANT_PRIMARY_BORDER: '#CA7AFF',

  TEXT_PRIMARY: '#1F2229',
  TEXT_SECONDARY: '#606F85',

  YELLOW_PRIMARY: '#eab308', // tailwind orange.500
  YELLOW_SECONDARY: '#fefce8', // tailwind orange.50
};

// TODO: move to theme
export const BREAK_POINT = {
  xxs: '375px',
  xs: '480px',
  sm: '576px',
  md: '768px',
  lg: '992px',
  xl: '1200px',
  xxl: '1600px',
};

// TODO: move to theme
export const MEDIA_QUERY = {
  mobileS: `@media only screen and (max-width: ${BREAK_POINT.xxs})`,
  mobileM: `@media only screen and (max-width: ${BREAK_POINT.xs})`,
  mobileL: `@media only screen and (max-width: ${BREAK_POINT.sm})`,
  tablet: `@media only screen and (max-width: ${BREAK_POINT.md})`,
  tabletL: `@media only screen and (max-width: ${BREAK_POINT.lg})`,
  laptop: `@media only screen and (max-width: ${BREAK_POINT.xl})`,
  desktop: `@media only screen and (max-width: ${BREAK_POINT.xxl})`,
};

export const BORDER_RADIUS = '5px';

export const BOX_SHADOW = {
  light: '0px 1px 6px rgba(0, 0, 0, 0.15)',
};

export const ANTD_COLOR = {
  borderColor: '#f0f0f0',
};
