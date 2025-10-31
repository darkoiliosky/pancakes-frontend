import { render, screen } from '@testing-library/react';
import Footer from '../src/components/Footer';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../src/public/api/useShop', () => ({ useShop: () => ({ data: { name: 'Shop' } }) }));

describe('Footer', () => {
  it('renders shop name away from home', () => {
    render(
      <MemoryRouter initialEntries={["/menu"]}>
        <Footer />
      </MemoryRouter>
    );
    expect(screen.getAllByText(/Shop/)[0]).toBeInTheDocument();
  });
});

