import { render, screen } from '@testing-library/react';
import Dashboard from '../src/admin/pages/Dashboard';

vi.mock('../src/admin/hooks/useDashboardStats', () => ({
  useDashboardStats: () => ({
    base: { data: { totalOrders: 10, totalIncome: 100, totalUsers: 5, mostSoldItems: [] } },
    derived: { series: [{ date: '2025-01-01', count: 1, income: 10 }], avgOrderValue: 10, pendingCount: 1, activeDeliveriesCount: 0, roleCounts: {} },
    isLoading: false,
    isError: false,
    updatedAt: Date.now(),
  })
}));
vi.mock('../src/admin/api/useAdminShop', () => ({ useAdminShop: () => ({ data: { currency: 'USD' } }) }));

describe('Admin Dashboard', () => {
  it('renders Dashboard heading', () => {
    render(<Dashboard />);
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });
});

