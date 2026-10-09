'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { PlusCircle, Search } from 'lucide-react';

import { api } from '@/lib/axios';
import { Ticket, Status } from '@/types';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuth } from '@/contexts/AuthContext';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const fetchTickets = async (status?: string) => {
  const url = status && status !== 'all' ? `/api/v1/tickets?status=${status}` : '/api/v1/tickets';
  const { data } = await api.get<Ticket[]>(url);
  return data;
};

const getStatusBadge = (status: Status) => {
  const styles: Record<Status, string> = {
    open: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
    in_progress: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
    resolved: 'bg-green-100 text-green-800 hover:bg-green-100',
    closed: 'bg-slate-100 text-slate-800 hover:bg-slate-100'
  };
  return <Badge className={`${styles[status]} border-none uppercase text-xs`} variant="outline">{status.replace('_', ' ')}</Badge>;
};

const getPriorityBadge = (priority: string) => {
  const styles: Record<string, string> = {
    low: 'text-slate-500 bg-slate-100 hover:bg-slate-100',
    medium: 'text-orange-600 bg-orange-100 hover:bg-orange-100',
    high: 'text-red-600 bg-red-100 hover:bg-red-100'
  };
  return <Badge className={`${styles[priority]} border-none uppercase text-xs`} variant="outline">{priority}</Badge>;
};

export default function TicketsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { user } = useAuth();

  const { data: tickets, isLoading, isError, error } = useQuery({
    queryKey: ['tickets', statusFilter],
    queryFn: () => fetchTickets(statusFilter),
  });

  return (
    <AuthGuard>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Tickets</h1>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] bg-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            {user?.role === 'customer' && (
              <Button asChild className="shrink-0">
                <Link href="/tickets/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Ticket
                </Link>
              </Button>
            )}
          </div>
        </div>

        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500 animate-pulse">Loading tickets...</div>
            ) : isError ? (
              <div className="p-8 text-center text-red-500">Failed to load tickets: {(error as Error).message}</div>
            ) : !tickets || tickets.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-slate-500">
                <Search className="h-10 w-10 text-slate-300 mb-3" />
                <p className="text-lg font-medium">No tickets found.</p>
                <p className="text-sm">Try changing your filters or create a new ticket.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="font-semibold text-slate-600">ID / Subject</TableHead>
                      <TableHead className="font-semibold text-slate-600">Priority</TableHead>
                      <TableHead className="font-semibold text-slate-600">Status</TableHead>
                      <TableHead className="font-semibold text-slate-600">Assignee</TableHead>
                      <TableHead className="font-semibold text-slate-600 text-right">Last Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((ticket) => (
                      <TableRow key={ticket.id} className="group hover:bg-slate-50 cursor-pointer transition-colors">
                        <TableCell>
                          <Link href={`/tickets/${ticket.id}`} className="block h-full w-full">
                            <div className="font-medium text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                              {ticket.subject}
                            </div>
                            <div className="text-xs text-slate-500">
                              #{ticket.id} • {ticket.category}
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link href={`/tickets/${ticket.id}`} className="block h-full w-full">
                            {getPriorityBadge(ticket.priority)}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link href={`/tickets/${ticket.id}`} className="block h-full w-full">
                            {getStatusBadge(ticket.status)}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link href={`/tickets/${ticket.id}`} className="block h-full w-full">
                            {ticket.assigned_agent ? (
                              <span className="text-sm text-slate-700">{ticket.assigned_agent.name}</span>
                            ) : (
                              <span className="text-sm text-slate-400 italic">Unassigned</span>
                            )}
                          </Link>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/tickets/${ticket.id}`} className="block h-full w-full">
                            <span className="text-sm text-slate-500 whitespace-nowrap">
                              {new Date(ticket.updated_at).toLocaleDateString()}
                            </span>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}
