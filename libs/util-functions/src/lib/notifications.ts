import { ReactNode } from 'react';
import { notification } from 'antd';

export const notifySuccess = (
  message: ReactNode = 'Successful',
  description: ReactNode = '',
  key?: string,
) => notification.success({ message, description, key });

export const notifyError = (
  message: ReactNode = 'Some error occurred',
  description: ReactNode = '',
  key?: string,
) => {
  notification.error({ message, description, key });
};

export const notifyWarning = (
  message: ReactNode = 'Some error occurred',
  description: ReactNode = '',
  key?: string,
) => notification.warning({ message, description, key });
