import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

jest.mock('./api/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue({ data: {} }),
  },
}));

test('renders login heading', async () => {
  render(<App />);
  await waitFor(() => {
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
  });
});
