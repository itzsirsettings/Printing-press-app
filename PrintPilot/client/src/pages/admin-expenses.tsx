import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';

export default function AdminExpenses(){
  const { data } = useQuery<any[]>({ queryKey: ['/api/expenses'], queryFn: async () => fetch('/api/expenses', { credentials: 'include' }).then(r => r.json()) });
  const mutation = useMutation<any, Error, any>((newItem: any) => apiRequest('POST', '/api/expenses', newItem));

  async function addSample(){
    await mutation.mutateAsync({ category: 'Supplies', description: 'Paper purchase', amount: '25.00', paymentMethod: 'cash' });
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Expenses</h2>
      <Button onClick={addSample} className="mb-4">Add sample expense</Button>
      <div className="space-y-2">
        {(data || []).map((e: any) => (
          <div key={e.id} className="p-3 border rounded">{e.category} - {e.amount}</div>
        ))}
      </div>
    </div>
  )
}
