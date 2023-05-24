import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { useRouter } from 'next/router';
import { notification } from 'antd/lib';
import RequestForm from 'common-util/List/RequestForm';
import { AlertSuccess, AlertError } from 'common-util/List/ListCommon';
import { getMechContract } from 'common-util/Contracts';
import { HeaderTitle } from 'common-util/Title';
import { FormContainer } from 'components/styles';
import { getIpfsResponse } from 'common-util/functions';

const Request = ({ account }) => {
  const [dataList, setDataList] = useState([]);
  const [error, setError] = useState(null);
  const [information, setInformation] = useState(null);
  const router = useRouter();
  const { hash } = router.query;

  useEffect(() => {
    const getData = async () => {
      const data = await getIpfsResponse(hash);
      setDataList(data.tools || []);
    };

    if (hash) getData();
  }, [hash]);

  const handleCancel = () => router.push('/mech');

  const handleSubmit = async (values) => {
    if (account) {
      setError(null);
      setInformation(null);

      const contract = getMechContract();

      try {
        const price = await contract.methods.price().call();

        await contract.methods
          .request(`0x${values.hash}`)
          .send({ from: account, value: price })
          .then((result) => {
            setInformation(result);
            notification.success({ message: 'Transaction successful' });
          });
      } catch (e) {
        setError(e);
        console.error(e);
      }
    }
  };

  return (
    <>
      <HeaderTitle title="Request" description="Make agent requests" />

      <FormContainer>
        <RequestForm
          listType="request"
          dataList={dataList}
          handleSubmit={handleSubmit}
          handleCancel={handleCancel}
        />
      </FormContainer>
      <AlertSuccess type="Request" information={information} />
      <AlertError error={error} />
    </>
  );
};

Request.propTypes = {
  account: PropTypes.string,
};

Request.defaultProps = {
  account: null,
};

const mapStateToProps = (state) => {
  const { account, balance } = state.setup;
  return { account, balance };
};

export default connect(mapStateToProps, {})(Request);
