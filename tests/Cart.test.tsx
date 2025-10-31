import { render, screen } from '@testing-library/react';
import Cart from '../src/public/pages/Cart';
import { MemoryRouter } from 'react-router-dom';
import { CartContext } from '../src/public/context/CartContext';
import { useShop as useShopOrig } from '../src/public/api/useShop';

vi.mock('../src/public/api/useShop', () => ({
  useShop: () => ({ data: { name: 'Shop', currency: 'USD', min_order: 0, is_open: true } }),
}));

describe('Cart page', () => {
  it('renders empty cart message', () => {
    const ctx = { items: [], subtotal: 0, setQty: vi.fn(), remove: vi.fn(), count: 0 } as any;
    render(
      <MemoryRouter>
        <CartContext.Provider value={ctx}>
          <Cart />
        </CartContext.Provider>
      </MemoryRouter>
    );
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
  });
});

