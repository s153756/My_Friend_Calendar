import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

// Keep your mock as is
jest.mock('./api/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue({ data: { message: "Success" } }),
  },
}));

test('navigates to and renders login page', async () => {
  render(<App />);

  // 1. Find the link in the navbar and click it
  const loginLink = screen.getByRole('link', { name: /login/i });
  userEvent.click(loginLink);

  // 2. Wait for the heading to appear on the new page
  await waitFor(() => {
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
  });
});