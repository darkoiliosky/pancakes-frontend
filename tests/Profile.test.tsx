import { render, screen } from '@testing-library/react';
import Profile from '../src/pages/Profile';
import { AuthContext } from '../src/context/AuthContext';

vi.mock('../src/api/useUpdateProfile', () => ({ useUpdateProfile: () => ({ mutateAsync: vi.fn() }) }));
vi.mock('../src/context/ToastContext', () => ({ useToast: () => ({ success: () => {}, error: () => {} }) }));

describe('Profile page', () => {
  it('renders user name as title', () => {
    const user = { id: 10, name: 'Darko Ilioski', email: 'd@test.com', role: 'customer' };
    render(
      <AuthContext.Provider value={{ user, loading: false, logout: () => {}, refreshUser: async () => {}, login: async () => {}, register: async () => {} } as any}>
        <Profile />
      </AuthContext.Provider>
    );
    expect(screen.getByText('Darko Ilioski')).toBeInTheDocument();
  });
});
