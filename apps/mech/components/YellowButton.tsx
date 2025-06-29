import { Button, ButtonProps, ConfigProvider } from 'antd';

import { EXTRA_COLORS } from 'util/constants';

type YellowButtonProps = ButtonProps & {
  children: React.ReactNode;
};

export const YellowButton = ({ children, ...props }: YellowButtonProps) => (
  <ConfigProvider
    theme={{
      token: {
        colorPrimary: EXTRA_COLORS.YELLOW_PRIMARY,
        colorBgBase: EXTRA_COLORS.YELLOW_SECONDARY,
        colorBgContainer: EXTRA_COLORS.YELLOW_SECONDARY,
        colorTextBase: EXTRA_COLORS.YELLOW_PRIMARY,
        colorBorder: EXTRA_COLORS.YELLOW_PRIMARY,
      },
    }}
  >
    <Button {...props}>{children}</Button>
  </ConfigProvider>
);
