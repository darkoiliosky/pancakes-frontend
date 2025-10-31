import { render, screen } from '@testing-library/react';
import Home from '../src/pages/Home';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../src/public/api/useShop', () => ({ useShop: () => ({ data: { name: 'Shop', currency: 'USD' } }) }));

describe('Home page', () => {
  it('renders hero and CTA', () => {
    render(<MemoryRouter><Home /></MemoryRouter>);
    expect(screen.getByText(/browse menu/i)).toBeInTheDocument();
  });
});

