"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { PlusCircle, Search, X, ChevronLeft, ChevronRight } from "lucide-react";

import { api } from "@/lib/axios";
import { Ticket, PaginatedTickets, Status } from "@/types";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/contexts/AuthContext";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface FetchTicketsParams {
  status?: string;
  search?: string;
  page: number;
  limit: number;
}

const fetchTickets = async ({
  status,
  search,
  page,
  limit,
}: FetchTicketsParams) => {
  const params = new URLSearchParams();
  if (status && status !== "all") {
    params.append("status", status);
  }
  if (search && search.trim()) {
    params.append("search", search.trim());
  }
  params.append("page", page.toString());
  params.append("limit", limit.toString());

  const { data } = await api.get<PaginatedTickets>(
    `/api/v1/tickets?${params.toString()}`,
  );
  return data;
};

export const getStatusBadge = (status: Status) => {
  const styles: Record<Status, string> = {
    open: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
    in_progress: "bg-blue-100 text-blue-800 hover:bg-blue-100",
    resolved: "bg-green-100 text-green-800 hover:bg-green-100",
    closed: "bg-slate-100 text-slate-800 hover:bg-slate-100",
  };
  return (
    <Badge
      className={`${styles[status]} border-none uppercase text-xs`}
      variant="outline"
    >
      {status.replace("_", " ")}
    </Badge>
  );
};

export const getPriorityBadge = (priority: string) => {
  const styles: Record<string, string> = {
    low: "text-slate-500 bg-slate-100 hover:bg-slate-100",
    medium: "text-orange-600 bg-orange-100 hover:bg-orange-100",
    high: "text-red-600 bg-red-100 hover:bg-red-100",
  };
  return (
    <Badge
      className={`${styles[priority]} border-none uppercase text-xs`}
      variant="outline"
    >
      {priority}
    </Badge>
  );
};

export default function TicketsPage() {
  const { user } = useAuth();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1); // Reset to page 1 on new search
    }, 300);

    return () => clearTimeout(handler);
  }, [searchInput]);

  const handleStatusChange = (v: string | null) => {
    setStatusFilter(v || "all");
    setPage(1); // Reset to page 1 on status change
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setStatusFilter("all");
    setPage(1);
  };

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: [
      "tickets",
      { status: statusFilter, search: debouncedSearch, page, limit },
    ],
    queryFn: () =>
      fetchTickets({
        status: statusFilter,
        search: debouncedSearch,
        page,
        limit,
      }),
    placeholderData: keepPreviousData,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });

  const tickets = data?.data || [];
  const total = data?.meta?.total || 0;
  const totalPages = data?.meta?.total_pages || 0;
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <AuthGuard>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Tickets
          </h1>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            {/* Search Box */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search subject or category..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 pr-8 bg-white h-9 text-sm"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full sm:w-40 bg-white h-9">
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

            {/* New Ticket button for customer */}
            {user?.role === "customer" && (
              <Link
                href="/tickets/new"
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "shrink-0 h-9",
                )}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                New Ticket
              </Link>
            )}
          </div>
        </div>

        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 text-center text-slate-500 animate-pulse">
                Loading tickets...
              </div>
            ) : isError ? (
              <div className="p-8 text-center text-red-500">
                Failed to load tickets: {(error as Error).message}
              </div>
            ) : !tickets || tickets.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-slate-500">
                <Search className="h-10 w-10 text-slate-300 mb-3" />
                <p className="text-lg font-medium text-slate-800">
                  No tickets found
                </p>
                <p className="text-sm text-slate-500 max-w-sm text-center mt-1">
                  {debouncedSearch || statusFilter !== "all"
                    ? "No tickets match your current filters. Try adjusting your search query or clear filters."
                    : "No tickets have been created yet."}
                </p>
                {(debouncedSearch || statusFilter !== "all") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearFilters}
                    className="mt-4"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="font-semibold text-slate-600">
                        ID / Subject
                      </TableHead>
                      <TableHead className="font-semibold text-slate-600">
                        Priority
                      </TableHead>
                      <TableHead className="font-semibold text-slate-600">
                        Status
                      </TableHead>
                      <TableHead className="font-semibold text-slate-600">
                        Assignee
                      </TableHead>
                      <TableHead className="font-semibold text-slate-600 text-right">
                        Last Updated
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody
                    className={cn(
                      isFetching && "opacity-70 transition-opacity",
                    )}
                  >
                    {tickets.map((ticket) => (
                      <TableRow
                        key={ticket.id}
                        className="group hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <TableCell>
                          <Link
                            href={`/tickets/${ticket.id}`}
                            className="block h-full w-full"
                          >
                            <div className="font-medium text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                              {ticket.subject}
                            </div>
                            <div className="text-xs text-slate-500">
                              #{ticket.id} • {ticket.category}
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/tickets/${ticket.id}`}
                            className="block h-full w-full"
                          >
                            {getPriorityBadge(ticket.priority)}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/tickets/${ticket.id}`}
                            className="block h-full w-full"
                          >
                            {getStatusBadge(ticket.status)}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/tickets/${ticket.id}`}
                            className="block h-full w-full"
                          >
                            {ticket.assigned_agent ? (
                              <span className="text-sm text-slate-700">
                                {ticket.assigned_agent.name}
                              </span>
                            ) : (
                              <span className="text-sm text-slate-400 italic">
                                Unassigned
                              </span>
                            )}
                          </Link>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            href={`/tickets/${ticket.id}`}
                            className="block h-full w-full"
                          >
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

            {/* Pagination Controls */}
            {total > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t bg-slate-50/50 text-sm text-slate-600">
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <span>
                    Showing{" "}
                    <strong className="font-semibold text-slate-900">
                      {startItem}
                    </strong>{" "}
                    to{" "}
                    <strong className="font-semibold text-slate-900">
                      {endItem}
                    </strong>{" "}
                    of{" "}
                    <strong className="font-semibold text-slate-900">
                      {total}
                    </strong>{" "}
                    tickets
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
                      onClick={() =>
                        setPage((prev) => Math.min(prev + 1, totalPages))
                      }
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
    </AuthGuard>
  );
}
