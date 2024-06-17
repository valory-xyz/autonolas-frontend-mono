import { Grid } from 'antd';

const { useBreakpoint } = Grid;

export const useScreen = () => {
  const screens = useBreakpoint();
  const isMobile = (screens.sm || screens.xs) && !screens.md;
  const isTablet = (screens.md || screens.lg) && !screens.xl;
  const isDesktop = screens.xl;

  return { isMobile, isTablet, isDesktop, ...screens };
};
