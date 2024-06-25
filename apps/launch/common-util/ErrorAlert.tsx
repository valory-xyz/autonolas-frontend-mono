import { Alert } from 'antd';
import { mainnet } from 'viem/chains';

import { EXPLORER_URLS, UNICODE_SYMBOLS } from 'libs/util-constants/src';

import { ErrorType } from 'types/index';

export const ErrorAlert = ({
  error,
  networkId,
}: {
  error: NonNullable<ErrorType>;
  networkId?: number | null;
}) => (
  <Alert
    className="mb-24"
    type="error"
    showIcon
    message={
      <>
        {error.message}
        {error.transactionHash && (
          <>
            <br />
            <a
              href={`${[EXPLORER_URLS[networkId || mainnet.id]]}/tx/${error.transactionHash}`}
              target="_blank"
            >{`Explore transaction hash ${UNICODE_SYMBOLS.EXTERNAL_LINK}`}</a>
          </>
        )}
      </>
    }
  />
);
