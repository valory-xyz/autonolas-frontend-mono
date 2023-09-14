import { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { useRouter } from 'next/router';
import { notification } from 'antd/lib';
import RegisterForm from 'common-util/List/RegisterForm';
import { AlertSuccess, AlertError } from 'common-util/List/ListCommon';
import { getMechMinterContract } from 'common-util/Contracts';
import { HeaderTitle } from 'common-util/Title';
import { FormContainer } from 'components/styles';

const MintAgent = ({ account }) => {
  const [error, setError] = useState(null);
  const [information, setInformation] = useState(null);
  const router = useRouter();

  const handleCancel = () => router.push('/registry');

  const handleSubmit = (values) => {
    if (account) {
      setError(null);
      setInformation(null);

      const contract = getMechMinterContract();

      contract.methods
        .create(values.owner_address, `0x${values.hash}`, values.price)
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
        <RegisterForm
          listType="agent"
          handleSubmit={handleSubmit}
          handleCancel={handleCancel}
        />
      </FormContainer>
      <AlertSuccess type="Agent" information={information} />
      <AlertError error={error} />
    </>
  );
};

MintAgent.propTypes = {
  account: PropTypes.string,
};

MintAgent.defaultProps = {
  account: null,
};

const mapStateToProps = (state) => {
  const { account, balance } = state.setup;
  return { account, balance };
};

export default connect(mapStateToProps, {})(MintAgent);
