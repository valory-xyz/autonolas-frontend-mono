import { MessageOutlined, UserAddOutlined } from '@ant-design/icons';
import { Button, Card, Table, Typography, notification } from 'antd';
import { cloneDeep } from 'lodash';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useSignMessage } from 'wagmi';

import { areAddressesEqual, notifyError, notifySuccess } from '@autonolas/frontend-library';

import { DisplayName } from 'common-util/DisplayName';
import { useCentaursFunctionalities } from 'components/CoOrdinate/Centaur/hooks';
import { VEOLAS_URL } from 'util/constants';

import { fetchVotingPower } from './requests';

const { Text } = Typography;

export const MembersList = () => {
  const router = useRouter();
  const [joinLoading, setJoinLoading] = useState(false);
  const account = useSelector((state) => state?.setup?.account);
  const { membersList, currentMemoryDetails, updateMemoryWithNewCentaur, fetchUpdatedMemory } =
    useCentaursFunctionalities();

  const addNewMember = async () => {
    try {
      const newMember = { address: account, ownership: 0 };
      const updatedMembers = [...(membersList || []), newMember];
      // update the members
      const updatedCentaur = cloneDeep(currentMemoryDetails);
      updatedCentaur.members = updatedMembers;

      // Update the Ceramic stream
      // const commitId = await updateMemoryWithNewCentaur(updatedCentaur);
      await updateMemoryWithNewCentaur(updatedCentaur);
      notifySuccess('Joined');

      // Add action to the centaur
      // const action = {
      //   actorAddress: account,
      //   commitId,
      //   description: 'joined the centaur',
      //   timestamp: Date.now(),
      // };

      await fetchUpdatedMemory();

      // const updateMemoryDetailsList = await fetchUpdatedMemory();
      // Commenting out until fixed
      // await triggerAction(centaurId, action, updateMemoryDetailsList);
    } catch (error) {
      console.error(error);
    }
  };

  const { signMessage } = useSignMessage({
    message: 'Sign this message to verify ownership over this address.',

    onSettled: async (_data, error) => {
      if (error) {
        console.error(error);
        notifyError('Some error occured while signing the message');
      } else {
        await addNewMember();
      }
      setJoinLoading(false);
    },
  });

  const onJoin = async () => {
    setJoinLoading(true);
    try {
      const balance = await fetchVotingPower({ account });
      if (Number(balance) === 0) {
        notifyError(
          <>
            You must hold veOLAS to join.&nbsp;
            <a href={VEOLAS_URL} target="_blank" rel="noopener noreferrer">
              Get veOLAS
            </a>
          </>,
        );
      } else {
        signMessage();
      }
    } catch (error) {
      notifyError('Join failed');
      console.error(error);
    } finally {
      setJoinLoading(false);
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'address',
      width: 160,
      render: (text) => (
        <Text type="secondary">
          <DisplayName actorAddress={text} />
          {areAddressesEqual(text, account) && <>&nbsp;(You)</>}
        </Text>
      ),
    },
    {
      dataIndex: 'actions',
      width: 100,
      render: (_text, record) => {
        const isSelf = areAddressesEqual(record.address, account);

        return (
          <>
            {!isSelf && (
              <Button
                disabled={!account}
                onClick={() => {
                  /**
                   * 1. on click => push to different page
                   * 2. get the current user and the selected user
                   * 3. get their conversation id
                   * 4. push to the chat page with the conversation id
                   * 5. get all the conversation messages
                   * 6. display the messages
                   * 7. send messages
                   */
                  router.push({
                    pathname: '/member-chat',
                    query: { address: record.address },
                  });
                }}
              >
                <MessageOutlined /> Message
              </Button>
            )}
          </>
        );
      },
      align: 'right',
    },
  ];

  const isMemberPresent = membersList.some((member) => areAddressesEqual(member.address, account));

  return (
    <Card
      title="List"
      bodyStyle={{ padding: 10 }}
      extra={[
        !isMemberPresent && (
          <Button
            type="primary"
            className="mr-12"
            disabled={!account}
            key="join"
            loading={joinLoading}
            onClick={onJoin}
          >
            Join
          </Button>
        ),
        <Button
          disabled={!account}
          key="invite"
          onClick={() => {
            notification.success({ message: 'Link copied' });
            navigator.clipboard.writeText(document.URL);
          }}
        >
          <UserAddOutlined />
          &nbsp;Invite
        </Button>,
      ]}
    >
      <Table
        columns={columns}
        dataSource={membersList}
        pagination={false}
        rowKey={(record) => record.address}
        bordered
      />
    </Card>
  );
};
