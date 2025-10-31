import { render, screen } from '@testing-library/react';
import ForgotPassword from '../src/pages/ForgotPassword';
import ResetPassword from '../src/pages/ResetPassword';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../src/api/client', () => ({ default: { post: vi.fn().mockResolvedValue({ data: { message: 'ok' } }) } }));

describe('Forgot/Reset pages', () => {
  it('renders forgot password', () => {
    const qc = new QueryClient();
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <ForgotPassword />
        </MemoryRouter>
      </QueryClientProvider>
    );
    expect(screen.getByText(/заборавена лозинка/i)).toBeInTheDocument();
  });

  it('renders reset password', () => {
    const qc = new QueryClient();
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={["/reset-password/abc"]}>
          <Routes>
            <Route path="/reset-password/:token" element={<ResetPassword />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
    expect(screen.getByText(/ресетирај лозинка/i)).toBeInTheDocument();
  });
});
