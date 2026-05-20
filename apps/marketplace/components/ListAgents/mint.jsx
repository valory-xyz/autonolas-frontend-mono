import { simulateContract, waitForTransactionReceipt, writeContract } from '@wagmi/core';
import { Typography } from 'antd';
import { useRouter } from 'next/router';
import { useState } from 'react';

import { notifyError, notifySuccess } from 'libs/util-functions/src';

import { mechMinterParams } from 'common-util/Contracts/params';
import { AlertError, AlertSuccess } from 'common-util/List/ListCommon';
import RegisterForm from 'common-util/List/RegisterForm';
import { wagmiConfig } from 'common-util/Login/config';
import { getChainId } from 'common-util/functions';
import { checkIfERC721Receive } from 'common-util/functions/requests';
import { useHelpers } from 'common-util/hooks';

import { FormContainer } from '../styles';

const { Title } = Typography;

const MintAgent = () => {
  const { account, chainName } = useHelpers();
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState(null);
  const [information, setInformation] = useState(null);
  const router = useRouter();

  const handleCancel = () => router.push(`/${chainName}/agent-blueprints`);

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
        const chainId = getChainId();
        const { request } = await simulateContract(wagmiConfig, {
          ...mechMinterParams(chainId),
          functionName: 'create',
          args: [
            1n,
            values.owner_address,
            `0x${values.hash}`,
            values.dependencies ? values.dependencies.split(', ').map(BigInt) : [],
          ],
          account,
        });
        const hash = await writeContract(wagmiConfig, request);
        const result = await waitForTransactionReceipt(wagmiConfig, { hash });
        setInformation(result);
        notifySuccess('Agent minted');
      } catch (e) {
        setError(e);
        console.error(e);
        notifyError('Error minting agent');
      } finally {
        setIsMinting(false);
      }
    }
  };

  return (
    <>
      <FormContainer>
        <Title level={2}>Add Agent Blueprint</Title>
        <RegisterForm
          isLoading={isMinting}
          listType="agent"
          handleSubmit={handleSubmit}
          handleCancel={handleCancel}
        />
      </FormContainer>
      <AlertSuccess type="Agent Blueprint" information={information} />
      <AlertError error={error} />
    </>
  );
};

export default MintAgent;
