import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { useRouter } from 'next/router';
import { notification } from 'antd';
import RequestForm from 'common-util/List/RequestForm';
import { AlertSuccess } from 'common-util/List/ListCommon';
import { getMechContract } from 'common-util/Contracts';
import { HeaderTitle } from 'common-util/Title';
import { getAgentHash, getIpfsResponse } from 'common-util/functions';
import { DEFAULT_AGENT_ID } from 'util/constants';
import { FormContainer } from '../../styles';
import { getAgent } from '../Registry/utils';

const Request = ({ account }) => {
  const [dataList, setDataList] = useState([]);
  const [information, setInformation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const hash = router?.query?.hash;

  useEffect(() => {
    const getIpfsDetailsFromHash = async (e) => {
      const data = await getIpfsResponse(e);
      setDataList(data.tools || []);
    };

    const getIpfsDetailsFromId = async () => {
      const agentDetails = await getAgent(DEFAULT_AGENT_ID);
      const currentHash = getAgentHash(agentDetails.agentHashes);
      await getIpfsDetailsFromHash(currentHash);
    };

    if (hash) {
      getIpfsDetailsFromHash(hash);
    } else {
      getIpfsDetailsFromId();
    }
  }, [hash]);

  const handleSubmit = async (values, onSuccess) => {
    if (account) {
      setInformation(null);
      setIsLoading(true);

      const contract = getMechContract();

      try {
        const price = await contract.methods.price().call();

        await contract.methods
          .request(`0x${values.hash}`)
          .send({ from: account, value: price })
          .then((result) => {
            onSuccess();
            setInformation(result);
            notification.success({
              message: 'Transaction executed',
              description: 'Delivery may take several seconds.',
            });
          });
      } catch (e) {
        notification.error(e);
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <>
      <HeaderTitle title="Request" description="Make agent requests" />

      <FormContainer>
        <RequestForm
          listType="request"
          isLoading={isLoading}
          dataList={dataList}
          handleSubmit={handleSubmit}
        />
      </FormContainer>
      <AlertSuccess type="Request" information={information} />
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
