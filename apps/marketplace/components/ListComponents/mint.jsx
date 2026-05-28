import { simulateContract, waitForTransactionReceipt, writeContract } from '@wagmi/core';
import { Typography } from 'antd';
import { useRouter } from 'next/router';
import { useState } from 'react';

import { estimateGasWithBuffer, notifyError, notifySuccess } from 'libs/util-functions/src';

import { mechMinterParams } from 'common-util/Contracts/params';
import { AlertError, AlertSuccess } from 'common-util/List/ListCommon';
import RegisterForm from 'common-util/List/RegisterForm';
import { wagmiConfig } from 'common-util/Login/config';
import { requireChainId } from 'common-util/functions';
import { checkIfERC721Receive } from 'common-util/functions/requests';
import { useHelpers } from 'common-util/hooks';

import { FormContainer } from '../styles';

const { Title } = Typography;

const MintComponent = () => {
  const { account, chainName } = useHelpers();
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState(null);
  const [information, setInformation] = useState(null);
  const router = useRouter();

  const handleCancel = () => router.push(`/${chainName}/components`);

  const handleSubmit = async (values) => {
    if (account) {
      setIsMinting(true);
      setError(null);
      setInformation(null);

      try {
        const isValid = await checkIfERC721Receive(account, values.owner_address);
        if (!isValid) {
          setIsMinting(false);
          return;
        }
      } catch (e) {
        setIsMinting(false);
        console.error(e);
      }

      try {
        const chainId = requireChainId();
        const callParams = {
          ...mechMinterParams(chainId),
          functionName: 'create',
          args: [
            0n,
            values.owner_address,
            `0x${values.hash}`,
            values.dependencies ? values.dependencies.split(', ').map(BigInt) : [],
          ],
          account,
        };
        const { request } = await simulateContract(wagmiConfig, callParams);
        const gas = await estimateGasWithBuffer(wagmiConfig, callParams);
        const hash = await writeContract(wagmiConfig, { ...request, gas });
        const result = await waitForTransactionReceipt(wagmiConfig, { hash });
        setInformation(result);
        notifySuccess('Component minted');
      } catch (e) {
        setError(e);
        console.error(e);
        notifyError('Error minting component');
      } finally {
        setIsMinting(false);
      }
    }
  };

  return (
    <>
      <FormContainer>
        <Title level={2}>Add Component</Title>
        <RegisterForm
          isLoading={isMinting}
          listType="component"
          handleSubmit={handleSubmit}
          handleCancel={handleCancel}
        />
      </FormContainer>
      <AlertSuccess type="Component" information={information} />
      <AlertError error={error} />
    </>
  );
};

export default MintComponent;
