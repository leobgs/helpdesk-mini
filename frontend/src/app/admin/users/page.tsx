'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusCircle, Users, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@/lib/axios';
import { User, Role, PaginatedUsers } from '@/types';
import { RoleGuard } from '@/components/auth/AuthGuard';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const createUserSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  role: z.enum(['agent', 'customer']),
});

interface FetchUsersParams {
  search?: string;
  role?: string;
  page: number;
  limit: number;
}

const fetchUsers = async ({ search, role, page, limit }: FetchUsersParams) => {
  const params = new URLSearchParams();
  if (search && search.trim()) {
    params.append('search', search.trim());
  }
  if (role && role !== 'all') {
    params.append('role', role);
  }
  params.append('page', page.toString());
  params.append('limit', limit.toString());

  const { data } = await api.get<PaginatedUsers>(`/api/v1/users?${params.toString()}`);
  return data;
};

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1); // Reset to page 1 on search change
    }, 300);

    return () => clearTimeout(handler);
  }, [searchInput]);

  const handleRoleChange = (val: string | null) => {
    setRoleFilter(val || 'all');
    setPage(1); // Reset to page 1 on role change
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setRoleFilter('all');
    setPage(1);
  };

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error: fetchError,
  } = useQuery({
    queryKey: ['users', { search: debouncedSearch, role: roleFilter, page, limit }],
    queryFn: () => fetchUsers({ search: debouncedSearch, role: roleFilter, page, limit }),
    placeholderData: keepPreviousData,
  });

  const users = data?.data || [];
  const total = data?.meta?.total || 0;
  const totalPages = data?.meta?.total_pages || 0;
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  const form = useForm<z.infer<typeof createUserSchema>>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: '', email: '', password: '', role: 'customer' },
  });

  const createUserMutation = useMutation({
    mutationFn: async (values: z.infer<typeof createUserSchema>) => {
      const { data } = await api.post('/api/v1/users', values);
      return data;
    },
    onSuccess: () => {
      toast.success('User created successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsDialogOpen(false);
      form.reset();
    },
  });

  function onSubmit(values: z.infer<typeof createUserSchema>) {
    createUserMutation.mutate(values);
  }

  const getRoleBadge = (role: Role) => {
    const styles: Record<Role, string> = {
      admin: 'bg-purple-100 text-purple-800',
      agent: 'bg-blue-100 text-blue-800',
      customer: 'bg-emerald-100 text-emerald-800',
    };
    return (
      <Badge className={`${styles[role]} border-none uppercase text-xs`} variant="outline">
        {role}
      </Badge>
    );
  };

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6" />
            Manage Users
          </h1>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            {/* Search Box */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search name or email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 pr-8 bg-white h-9 text-sm"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Role Filter */}
            <Select value={roleFilter} onValueChange={handleRoleChange}>
              <SelectTrigger className="w-full sm:w-36 bg-white h-9 text-sm">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
              </SelectContent>
            </Select>

            {/* Add User Dialog */}
            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) {
                  createUserMutation.reset();
                  form.reset();
                }
              }}
            >
              <Button onClick={() => setIsDialogOpen(true)} className="h-9 shrink-0">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add User
              </Button>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>
                    Create an agent or customer account for your business.
                  </DialogDescription>
                </DialogHeader>

                {createUserMutation.isError && (
                  <div className="text-sm font-medium text-red-500 p-3 bg-red-50 rounded-md border border-red-200">
                    {(createUserMutation.error as any)?.response?.data?.detail || 'Failed to create user.'}
                  </div>
                )}

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }: any) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
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
                            <Input type="email" placeholder="user@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }: any) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="customer">Customer</SelectItem>
                              <SelectItem value="agent">Agent</SelectItem>
                            </SelectContent>
                          </Select>
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

                    <div className="flex justify-end pt-2">
                      <Button type="submit" disabled={createUserMutation.isPending}>
                        {createUserMutation.isPending ? 'Saving...' : 'Save User'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 text-center text-slate-500 animate-pulse">Loading users...</div>
            ) : isError ? (
              <div className="p-8 text-center text-red-500">
                Failed to load users: {(fetchError as Error).message}
              </div>
            ) : !users || users.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-slate-500">
                <Search className="h-10 w-10 text-slate-300 mb-3" />
                <p className="text-lg font-medium text-slate-800">No users found</p>
                <p className="text-sm text-slate-500 max-w-sm text-center mt-1">
                  {debouncedSearch || roleFilter !== 'all'
                    ? 'No users match your current filters. Try adjusting your search query or clear filters.'
                    : 'No users have been created yet.'}
                </p>
                {(debouncedSearch || roleFilter !== 'all') && (
                  <Button variant="outline" size="sm" onClick={handleClearFilters} className="mt-4">
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="font-semibold text-slate-600">ID</TableHead>
                      <TableHead className="font-semibold text-slate-600">Name</TableHead>
                      <TableHead className="font-semibold text-slate-600">Email</TableHead>
                      <TableHead className="font-semibold text-slate-600">Role</TableHead>
                      <TableHead className="font-semibold text-slate-600 text-right">Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className={cn(isFetching && 'opacity-70 transition-opacity')}>
                    {users.map((user) => (
                      <TableRow key={user.id} className="hover:bg-slate-50 transition-colors">
                        <TableCell className="font-medium text-slate-900">#{user.id}</TableCell>
                        <TableCell className="font-medium text-slate-900">{user.name}</TableCell>
                        <TableCell className="text-slate-600">{user.email}</TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell className="text-right text-sm text-slate-500 whitespace-nowrap">
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination Controls */}
            {total > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t bg-slate-50/50 text-sm text-slate-600">
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <span>
                    Showing <strong className="font-semibold text-slate-900">{startItem}</strong> to{' '}
                    <strong className="font-semibold text-slate-900">{endItem}</strong> of{' '}
                    <strong className="font-semibold text-slate-900">{total}</strong> users
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Rows:</span>
                    <Select
                      value={limit.toString()}
                      onValueChange={(val: string | null) => {
                        if (val) {
                          setLimit(Number(val));
                          setPage(1);
                        }
                      }}
                    >
                      <SelectTrigger className="h-8 w-18 bg-white text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2.5 bg-white text-xs"
                      onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                      disabled={page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Prev
                    </Button>

                    <div className="px-3 text-xs font-medium text-slate-700 whitespace-nowrap">
                      Page {page} of {totalPages || 1}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2.5 bg-white text-xs"
                      onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={page >= totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}

