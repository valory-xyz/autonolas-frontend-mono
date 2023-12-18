/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';
import { Card, Row, Typography } from 'antd';

import styled from 'styled-components';
import Inbox from '../Inbox';

const Container = styled.div`
  .ant-card {
    width: 620px;
    .ant-card-head {
      overflow: auto;
    }
    pre {
      overflow: auto;
    }
  }
`;

export const Request = () => {
  const [prompt, setPrompt] = useState('');
  const [_account, setAccount] = useState('');

  useEffect(() => {
    // Get the state after navigation
    const storedPrompt = localStorage.getItem('prompt');
    const storedAccount = localStorage.getItem('account');

    if (storedPrompt && storedAccount) {
      setPrompt(storedPrompt);
      setAccount(storedAccount);
    }
  }, []);

  return (
    <Container>
      <Card
        title={(
          <Typography.Text>
            Success! Your prompt is being worked on ...
          </Typography.Text>
        )}
      >
        <Typography.Text>
          {prompt}
        </Typography.Text>
      </Card>
      <Row style={{ height: '20px' }} />
      <Card
        title={(
          <Typography.Text>
            Stay informed with Wallet Connect notifications!
          </Typography.Text>
        )}
      >
        <Inbox />
      </Card>
    </Container>

  );
};
