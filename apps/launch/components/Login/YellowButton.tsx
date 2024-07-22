import { Button, ButtonProps, ConfigProvider } from 'antd';
import { FC, ReactNode } from 'react';

import { COLOR } from 'libs/ui-theme/src';

// TODO: move to ui library
type YellowButtonProps = { children: ReactNode } & ButtonProps;

export const YellowButton: FC<YellowButtonProps> = ({ children, ...props }) => (
  <ConfigProvider
    theme={{
      token: {
        colorPrimary: COLOR.YELLOW_PRIMARY,
        colorBgBase: COLOR.YELLOW_SECONDARY,
        colorTextBase: COLOR.YELLOW_PRIMARY,
        colorBorder: COLOR.YELLOW_PRIMARY,
      },
    }}
  >
    <Button {...props} size="large">{children}</Button>
  </ConfigProvider>
);
