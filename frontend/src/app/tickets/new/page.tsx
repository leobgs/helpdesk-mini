'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { api } from '@/lib/axios';
import { RoleGuard } from '@/components/auth/AuthGuard';

const createTicketSchema = z.object({
  subject: z.string().min(5, { message: 'Subject must be at least 5 characters' }),
  category: z.string().min(2, { message: 'Please select or enter a category' }),
  priority: z.enum(['low', 'medium', 'high']),
  message: z.string().min(10, { message: 'Message must be at least 10 characters' }),
});

export default function CreateTicketPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof createTicketSchema>>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: { subject: '', category: '', priority: 'medium', message: '' },
  });

  async function onSubmit(values: z.infer<typeof createTicketSchema>) {
    setError(null);
    try {
      const { data } = await api.post('/api/v1/tickets', values);
      router.push(`/tickets/${data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create ticket. Please try again.');
    }
  }

  return (
    <RoleGuard allowedRoles={['customer']}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/tickets">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-slate-800">Create New Ticket</h1>
        </div>

        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle>Ticket Details</CardTitle>
            <CardDescription>Describe your issue or request in detail so we can help you.</CardDescription>
          </CardHeader>
          <CardContent>
            {error && <div className="text-sm font-medium text-red-500 mb-4 p-3 bg-red-50 rounded-md border border-red-200">{error}</div>}
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g. Unable to login to dashboard" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="technical">Technical Support</SelectItem>
                            <SelectItem value="billing">Billing</SelectItem>
                            <SelectItem value="general">General Inquiry</SelectItem>
                            <SelectItem value="feature">Feature Request</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Please provide as much detail as possible..."
                          className="min-h-[150px] resize-y"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Creating...' : 'Submit Ticket'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
