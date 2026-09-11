import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';

import { store } from 'store/index';

import { PathPage } from './index';
import { steps } from './constants';

// Rendering every step means every step's hooks run, and one of them reads Redux. In the app
// `_app.tsx` supplies the Provider; the test has to supply its own.
const renderPage = () =>
  render(
    <Provider store={store}>
      <PathPage />
    </Provider>,
  );

describe('PathPage step panels', () => {
  // Guards the Phase 2 contract for this page. A crawler fetches it once, so rendering only the
  // selected step published one step of six with no sign the rest existed. Every step must be in
  // the DOM; only the selected one may be visible.
  it('renders every step into the DOM, not just the selected one', () => {
    const { container } = renderPage();

    const panels = container.querySelectorAll('[hidden]');
    expect(panels).toHaveLength(steps.length - 1);
  });

  it('keeps exactly one step visible, so the page looks unchanged', () => {
    const { container } = renderPage();

    const hiddenCount = container.querySelectorAll('[hidden]').length;
    expect(steps.length - hiddenCount).toBe(1);
  });

  it('serves content from a step that is not selected', () => {
    renderPage();

    // From the final step, which is never the initial selection.
    expect(
      screen.getByText(/Sit back and relax as AI agents become your DAUs/i),
    ).toBeInTheDocument();
  });
});
