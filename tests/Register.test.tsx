import { render, screen } from '@testing-library/react';
import Register from '../src/pages/Register';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../src/context/AuthContext';

vi.mock('../src/context/ToastContext', () => ({ useToast: () => ({ success: () => {}, error: () => {} }) }));

vi.mock('../src/api/useAuth', () => ({ useRegister: () => ({ mutateAsync: vi.fn() }) }));

describe('Register page', () => {
  it('renders fields', () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider value={{ user: null, loading: false, login: async () => {}, register: async () => {}, logout: async () => {}, refreshUser: async () => {} } as any}>
          <Register />
        </AuthContext.Provider>
      </MemoryRouter>
    );
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });
});
