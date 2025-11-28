import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '@/App';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

test('renders sidebar links', () => {
  render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
  expect(screen.getByTestId('link-new-job')).toBeInTheDocument();
  expect(screen.getByTestId('link-order-history')).toBeInTheDocument();
  expect(screen.getByTestId('link-price-lists')).toBeInTheDocument();
});
