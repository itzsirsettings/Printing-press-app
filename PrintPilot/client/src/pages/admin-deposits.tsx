import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';

export default function AdminDeposits(){
  const { data } = useQuery<any[]>({ queryKey: ['/api/deposits'], queryFn: async () => fetch('/api/deposits', { credentials: 'include' }).then(r => r.json()) });
  const mutation = useMutation<any, Error, any>((newItem: any) => apiRequest('POST', '/api/deposits', newItem));

  async function addSample(){
    await mutation.mutateAsync({ customerId: null, amount: '50.00', description: 'Initial deposit', paymentMethod: 'cash' });
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Deposits</h2>
      <Button onClick={addSample} className="mb-4">Add sample deposit</Button>
      <div className="space-y-2">
        {(data || []).map((d: any) => (
          <div key={d.id} className="p-3 border rounded">{d.description} - {d.amount}</div>
        ))}
      </div>
    </div>
  )
}
