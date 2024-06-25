import { render } from '@testing-library/react';

import { Footer } from './index';

const githubUrl = 'https://github.com/valory-xyz/autonolas-frontend-mono';

describe('<Footer>', () => {
  it('should render footer', async () => {
    const { getByText, getAllByRole } = render(<Footer githubUrl={githubUrl} />);
    expect(getByText(/Valory/)).toBeInTheDocument();

    const links = getAllByRole('link');
    expect(links).toHaveLength(3);

    const githubLink = links.find((link) => link.getAttribute('href') === githubUrl);
    expect(githubLink).toBeInTheDocument();
  });
});
