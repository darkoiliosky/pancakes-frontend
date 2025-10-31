import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../src/components/ErrorBoundary';

function Boom() { throw new Error('boom'); }

describe('ErrorBoundary', () => {
  it('catches errors and renders fallback', () => {
    // suppress console.error for this test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        {/* @ts-ignore */}
        <Boom />
      </ErrorBoundary>
    );
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    spy.mockRestore();
  });
});
