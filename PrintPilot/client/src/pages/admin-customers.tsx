import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  company: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
});

type CustomerForm = z.infer<typeof customerSchema>;

export default function AdminCustomers(){
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data } = useQuery<any[]>({ queryKey: ['/api/customers'], queryFn: async () => fetch('/api/customers', { credentials: 'include' }).then(r => r.json()) });

  const createMutation = useMutation<any, Error, any>((newCustomer: any) => apiRequest('POST', '/api/customers', newCustomer), {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      toast({ title: 'Customer added' });
    },
    onError: (err: any) => toast({ title: 'Add failed', description: err.message || String(err) }),
  });

  const updateMutation = useMutation<any, Error, any>(({ id, data }: any) => apiRequest('PUT', `/api/customers/${id}`, data), {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      toast({ title: 'Customer updated' });
    },
    onError: (err: any) => toast({ title: 'Update failed', description: err.message || String(err) }),
  });

  const deleteMutation = useMutation<any, Error, string>((id: string) => apiRequest('DELETE', `/api/customers/${id}`), {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      toast({ title: 'Customer deleted' });
    },
    onError: (err: any) => toast({ title: 'Delete failed', description: err.message || String(err) }),
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<CustomerForm>({ resolver: zodResolver(customerSchema) });

  async function onCreate(values: CustomerForm) {
    await createMutation.mutateAsync(values);
    form.reset();
  }

  function startEdit(customer: any) {
    setEditingId(customer.id);
    form.reset({ name: customer.name, email: customer.email || '', phone: customer.phone || '', company: customer.company || '', address: customer.address || '' });
  }

  async function onUpdate(values: CustomerForm) {
    if (!editingId) return;
    await updateMutation.mutateAsync({ id: editingId, data: values });
    setEditingId(null);
    form.reset();
  }

  return (
    <div className="p-6 max-w-3xl">
      <h2 className="text-xl font-semibold mb-4">Customers</h2>

      <form onSubmit={form.handleSubmit(editingId ? onUpdate : onCreate)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField name="name" control={form.control} render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField name="email" control={form.control} render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField name="phone" control={form.control} render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField name="company" control={form.control} render={({ field }) => (
            <FormItem>
              <FormLabel>Company</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="flex gap-2 mt-4">
          <Button type="submit">{editingId ? 'Update' : 'Create'}</Button>
          {editingId && <Button variant="outline" onClick={() => { setEditingId(null); form.reset(); }}>Cancel</Button>}
        </div>
      </Form>

      <div className="mt-6 space-y-3">
        {(data || []).map((c: any) => (
          <div key={c.id} className="flex items-center justify-between p-3 border rounded">
            <div>
              <div className="font-medium">{c.name}</div>
              <div className="text-sm text-muted-foreground">{c.email} {c.phone ? `• ${c.phone}` : ''}</div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => startEdit(c)}>Edit</Button>
              <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutateAsync(c.id)}>Delete</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
