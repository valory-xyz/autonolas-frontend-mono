import React, { useState } from 'react';
import {
  Typography, Space, Button, Alert,
} from 'antd/lib';
import ListAgents from './components/ListAgents';

export const Registry = () => {
  return (
    <div>
      <ListAgents />
    </div>
  );
};
