import { render, screen } from '@testing-library/react';
import MaintenanceBanner from '../src/components/MaintenanceBanner';

describe('MaintenanceBanner', () => {
  it('renders message when present', () => {
    vi.mock('../src/public/api/useShop', () => ({ useShop: () => ({ data: { maintenance_message: 'Planned' } }) }));
    render(<MaintenanceBanner />);
    expect(screen.getByText(/maintenance:/i)).toBeInTheDocument();
  });
});

