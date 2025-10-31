import { render, screen } from '@testing-library/react';
import MyDeliveries from '../src/courier/pages/MyDeliveries';

vi.mock('../src/courier/api/useCourierDeliveries', () => ({
  useCourierDeliveries: () => ({ data: [], isLoading: false, isError: false, refetch: vi.fn() }),
  useUpdateCourierDelivery: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAvailableOrders: () => ({ data: [], isLoading: false, refetch: vi.fn() }),
  useSelfAssign: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock('../src/context/ToastContext', () => ({ useToast: () => ({ success: () => {}, error: () => {}, info: () => {} }) }));

describe('Courier page', () => {
  it('renders heading', () => {
    render(<MyDeliveries />);
    expect(screen.getByText(/my deliveries/i)).toBeInTheDocument();
  });
});

