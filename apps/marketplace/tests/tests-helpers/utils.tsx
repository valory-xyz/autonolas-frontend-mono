import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ACTIVE_TAB } from './index';

export const checkAndGetTabComponent = async (
  container: HTMLElement,
  tabSelector: string,
  tabName: string,
) => {
  const unitTab = container.querySelector(tabSelector);

  if (!unitTab) {
    throw new Error(`"${tabName}" tab is null`);
  }

  // wait until the tab is enabled
  await waitFor(async () => expect(unitTab).not.toHaveAttribute('aria-disabled'));

  // click the tab
  await userEvent.click(unitTab);

  // check if the selected tab is active
  await waitFor(async () => expect(container.querySelector(ACTIVE_TAB)?.textContent).toBe(tabName));

  return unitTab;
};
