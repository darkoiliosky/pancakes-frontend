import { render, screen } from '@testing-library/react';
import Login from '../src/pages/Login';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../src/context/AuthContext';

vi.mock('../src/api/useAuth', () => ({ useLogin: () => ({ mutateAsync: vi.fn() }) }));

describe('Login page', () => {
  it('renders form inputs', () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider value={{ user: null, loading: false, login: async () => {}, register: async () => {}, logout: async () => {}, refreshUser: async () => {} } as any}>
          <Login />
        </AuthContext.Provider>
      </MemoryRouter>
    );
    expect(screen.getByLabelText(/Е-пошта/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Лозинка/i)).toBeInTheDocument();
  });
});
