import { notification } from 'antd';
import { useRouter } from 'next/router';
import { useState } from 'react';

import { getMechMinterContract } from 'common-util/Contracts';
import { AlertError, AlertSuccess } from 'common-util/List/ListCommon';
import RegisterForm from 'common-util/List/RegisterForm';
import { HeaderTitle } from 'common-util/Title';
import { useHelpers } from 'common-util/hooks/useHelpers';
import { FormContainer } from 'components/styles';
import { URL } from 'util/constants';

const FactoryManage = () => {
  const [error, setError] = useState(null);
  const [information, setInformation] = useState(null);
  const router = useRouter();
  const { account } = useHelpers();

  const networkNameFromUrl = router?.query?.network;

  const handleCancel = () => router.push(`/${networkNameFromUrl}/${URL.MECHS}`);

  const handleSubmit = (values) => {
    if (account) {
      setError(null);
      setInformation(null);

      const contract = getMechMinterContract();

      contract.methods
        .create(values.owner_address, `0x${values.hash}`, values.price, values.mechMarketplace)
        .send({ from: account })
        .then((result) => {
          setInformation(result);
          notification.success({ message: 'Agent minted' });
        })
        .catch((e) => {
          setError(e);
          console.error(e);
        });
    }
  };

  return (
    <>
      <HeaderTitle title="Mint" description="Mint agent" />

      <FormContainer>
        <RegisterForm listType="agent" handleSubmit={handleSubmit} handleCancel={handleCancel} />
      </FormContainer>
      <AlertSuccess type="Agent" information={information} />
      <AlertError error={error} />
    </>
  );
};

export default FactoryManage;
