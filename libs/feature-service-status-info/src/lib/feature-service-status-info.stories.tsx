import type { Meta, StoryObj } from '@storybook/react';
import { FeatureServiceStatusInfo } from './feature-service-status-info';

import { within } from '@storybook/testing-library';
import { expect } from '@storybook/jest';

const meta: Meta<typeof FeatureServiceStatusInfo> = {
  component: FeatureServiceStatusInfo,
  title: 'FeatureServiceStatusInfo',
};
export default meta;
type Story = StoryObj<typeof FeatureServiceStatusInfo>;

export const Primary = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(
      canvas.getByText(/Welcome to FeatureServiceStatusInfo!/gi)
    ).toBeTruthy();
  },
};
