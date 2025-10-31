import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../src/components/Navbar';
import { AuthContext } from '../src/context/AuthContext';

vi.mock('../src/public/components/CartMini', () => ({ default: () => (<span>Корпа</span>) }));
vi.mock('../src/public/api/useShop', () => ({ useShop: () => ({ data: { name: 'Shop', currency: 'USD' } }) }));

function renderWithAuth(user: any) {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={{ user, loading: false, logout: () => {}, refreshUser: async () => {}, login: async () => {}, register: async () => {} } as any}>
        <Navbar />
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe('Navbar', () => {
  it('shows admin button for admin users', () => {
    renderWithAuth({ id: 1, name: 'Admin', role: 'admin' });
    expect(screen.getAllByText(/admin/i).length).toBeGreaterThan(0);
  });

  it('shows Корпа mini cart for customers', () => {
    renderWithAuth({ id: 2, name: 'Cust', role: 'customer' });
    expect(screen.getByText(/Корпа/i)).toBeInTheDocument();
  });
});
