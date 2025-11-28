import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';

export default function AdminSales(){
  const { data } = useQuery(['/api/sales'], { queryFn: async ({ queryKey }) => fetch(queryKey[0] as string, { credentials: 'include' }).then(r => r.json()) });
  const mutation = useMutation((newSale: any) => apiRequest('POST', '/api/sales', newSale));

  async function addSample(){
    await mutation.mutateAsync({ paperType: 'A4', paperVariant: 'Matte', quantity: 10, unitPrice: '2.00', total: '20.00' });
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Sales</h2>
      <Button onClick={addSample} className="mb-4">Add sample sale</Button>
      <div className="space-y-2">
        {(data || []).map((s: any) => (
          <div key={s.id} className="p-3 border rounded">{s.saleNumber} - {s.paperType} - {s.total}</div>
        ))}
      </div>
    </div>
  )
}
