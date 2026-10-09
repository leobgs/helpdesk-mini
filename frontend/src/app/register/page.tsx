'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/axios';

const registerSchema = z.object({
  business_name: z.string().min(2, { message: 'Business name must be at least 2 characters' }),
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

export default function RegisterPage() {
  const { user, login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      router.push('/tickets');
    }
  }, [user, router]);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { business_name: '', name: '', email: '', password: '' },
  });

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    setError(null);
    try {
      // 1. Register business and admin
      await api.post('/api/v1/auth/register-business', values);
      
      // 2. Log in automatically after registration
      const { data } = await api.post('/api/v1/auth/login', {
        email: values.email,
        password: values.password,
      });
      
      login(data);
      router.push('/tickets');
    } catch (err: any) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Registration failed. Please check your inputs.');
      }
    }
  }

  if (user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Register Business</CardTitle>
          <CardDescription>Create a new business workspace and admin account</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <div className="text-sm font-medium text-red-500 mb-4 p-3 bg-red-50 rounded-md border border-red-200">{error}</div>}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="business_name"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Business Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Tech Corp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Admin Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Admin User" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="admin@techcorp.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="ml-1 text-slate-900 font-medium hover:underline">
            Sign In
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
