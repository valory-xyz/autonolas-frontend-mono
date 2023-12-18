import React, { useState } from 'react';
import {
  Form, Input, Button, Card, ConfigProvider,
} from 'antd';
import { useRouter } from 'next/router';
import { notifyError, notifySuccess } from '@autonolas/frontend-library';

import { GREEN_THEME } from '../../util/theme';
import { useHelpers } from '../../common-util/hooks';
import { getMechContract, getAgentMultisig, getAgentURL } from '../../common-util/Contracts';

const FORM_NAME = 'ipfs_creation_form_for_mech';
const FORM_ID = 'myForm';

export const RequestForm = () => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { account } = useHelpers();

  const onFinishFailed = (errorInfo) => {
    window.console.warn('Failed:', errorInfo);
  };

  const onFinish = async (values) => {
    try {
      setIsLoading(true);

      try {
        const contract = getMechContract();
        const agentMultisigAddress = getAgentMultisig();
        const agentURL = getAgentURL();
        const price = await contract.methods.price().call();

        await contract.methods
          .subscribe(agentMultisigAddress)
          .send({ from: account, value: price })
          .then(async (result) => {
            notifySuccess(
              'Transaction executed',
              'Upon delivery you will be notified!',
            );
            // Prepare the request data
            const requestData = {
              address: account,
              prompt: values.prompt,
              tool: 'short-maker',
            };
            // Perform the HTTP POST request only after confirming the transaction
            try {
              const response = await fetch(`${agentURL}/generate`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'text/plain',
                  // Authorization: `${process.env.NEXT_PUBLIC_AGENT_AUTH}`,
                },
                body: JSON.stringify(requestData),
                // // TOFIX
                // mode: 'no-cors',
              });

              // Check if the request was successful
              if (response.ok) {
                // const jsonResponse = await response.json();
              } else {
                throw new Error('Request to agent failed');
              }
            } catch (error) {
              console.error('Error making the POST request:', error);
              notifyError('Oops - looks like the agent is down :(');
            }
            localStorage.setItem('prompt', values.prompt);
            localStorage.setItem('account', account);
            router.push({
              pathname: `/requests/${result.events.Subscription.returnValues.sender}`,
            });
          });
      } catch (e) {
        console.error(e);
        notifyError("Couldn't execute transaction");
      } finally {
        setIsLoading(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card title="Imagine your content ..." style={{ width: 420 }}>
      <Form
        form={form}
        name={FORM_NAME}
        layout="vertical"
        autoComplete="off"
        preserve={false}
        id={FORM_ID}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
      >

        <Form.Item
          // label="Prompt"
          name="prompt"
          rules={[{ required: true, message: 'Please write a short prompt to guide your AI content Generatooorr.' }]}
        >
          <Input.TextArea
            rows={2}
            placeholder="... write a short prompt to guide your AI content Generatooorr."
          />
        </Form.Item>

        <Form.Item>
          <ConfigProvider theme={GREEN_THEME}>
            <Button
              form={FORM_ID}
              htmlType="submit"
              type="primary"
              disabled={!account}
              loading={isLoading}
            >
              Go
            </Button>
          </ConfigProvider>
        </Form.Item>
      </Form>
    </Card>
  );
};

RequestForm.propTypes = {};

RequestForm.defaultProps = {};
