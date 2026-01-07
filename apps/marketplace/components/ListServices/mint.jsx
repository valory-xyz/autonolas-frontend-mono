import { Typography } from 'antd';
import { useState } from 'react';

import { notifyError, notifySuccess, getEstimatedGasLimit } from 'libs/util-functions/src';

import { getServiceManagerContract } from 'common-util/Contracts';
import { sendTransaction } from 'common-util/functions';
import { checkIfERC721Receive } from 'common-util/functions/requests';
import { useHelpers } from 'common-util/hooks';
import { useSvmConnectivity } from 'common-util/hooks/useSvmConnectivity';
import { AlertError, AlertSuccess, convertStringToArray } from 'common-util/List/ListCommon';
import {
  DEFAULT_SERVICE_CREATION_ETH_TOKEN,
  DEFAULT_SERVICE_CREATION_ETH_TOKEN_ZEROS,
} from 'util/constants';

import { FormContainer } from '../styles';
import { buildSvmArgsToMintOrUpdate } from './helpers/functions';
import RegisterForm from './helpers/RegisterForm';
import { getAgentParams } from './utils';

const { Title } = Typography;

const MintService = () => {
  const { account, doesNetworkHaveValidServiceManagerToken, vmType, isSvm } = useHelpers();
  const { solanaAddresses, program } = useSvmConnectivity();

  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState(null);
  const [information, setInformation] = useState(null);

  const buildSvmCreateFn = async (values) => {
    const { owner_address: ownerAddress } = values;

    const args = [ownerAddress, ...buildSvmArgsToMintOrUpdate(values)];
    const fn = program.methods
      .create(...args)
      .accounts({ dataAccount: solanaAddresses.storageAccount })
      .remainingAccounts([{ pubkey: ownerAddress, isSigner: true, isWritable: true }]);

    return fn;
  };

  const buildEvmParams = (values) => {
    const commonParams = [
      `0x${values.hash}`,
      convertStringToArray(values.agent_ids),
      getAgentParams(values),
      values.threshold,
    ];

    const params = doesNetworkHaveValidServiceManagerToken
      ? [
          values.owner_address,
          values.token === DEFAULT_SERVICE_CREATION_ETH_TOKEN_ZEROS
            ? DEFAULT_SERVICE_CREATION_ETH_TOKEN
            : values.token,
          ...commonParams,
        ]
      : [values.owner_address, ...commonParams];

    return params;
  };

  const handleSubmit = async (values) => {
    if (!account) {
      notifyError('Wallet not connected');
      return;
    }

    setIsMinting(true);
    setError(null);
    setInformation(null);

    let fn;

    if (isSvm) {
      fn = await buildSvmCreateFn(values);
    } else {
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

      const contract = await getServiceManagerContract();
      const params = buildEvmParams(values);
      const createFn = contract.methods.create(...params);
      const estimatedGas = await getEstimatedGasLimit(createFn, account);
      fn = createFn.send({ from: account, gasLimit: estimatedGas });
    }

    try {
      const result = await sendTransaction(fn, account || undefined, {
        vmType,
        registryAddress: solanaAddresses.serviceRegistry,
      });
      setInformation(result);
      notifySuccess('AI Agent added');
    } catch (e) {
      setError(e);
      console.error(e);
      notifyError("Couldn't add AI Agent");
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <>
      <FormContainer>
        <Title level={2}>Add AI Agent</Title>
        <RegisterForm
          isLoading={isMinting}
          account={account}
          formInitialValues={{}}
          handleSubmit={handleSubmit}
        />
      </FormContainer>

      {/* todo: add link to new service on creation */}
      <AlertSuccess type="AI Agent" information={information} />
      <AlertError error={error} />
    </>
  );
};

export default MintService;
