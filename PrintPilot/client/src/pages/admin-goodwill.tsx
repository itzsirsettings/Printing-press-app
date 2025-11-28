import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';

export default function AdminGoodwill(){
  const { data } = useQuery<any[]>({ queryKey: ['/api/goodwill'], queryFn: async () => fetch('/api/goodwill', { credentials: 'include' }).then(r => r.json()) });
  const mutation = useMutation<any, Error, any>((newItem: any) => apiRequest('POST', '/api/goodwill', newItem));

  async function addSample(){
    await mutation.mutateAsync({ customerId: null, amount: '5.00', reason: 'Courtesy', type: 'credit' });
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Goodwill Transactions</h2>
      <Button onClick={addSample} className="mb-4">Add sample goodwill</Button>
      <div className="space-y-2">
        {(data || []).map((g: any) => (
          <div key={g.id} className="p-3 border rounded">{g.reason} - {g.amount}</div>
        ))}
      </div>
    </div>
  )
}
