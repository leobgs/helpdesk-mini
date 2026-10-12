"use client";

import { User, UserCheck } from "lucide-react";
import { Ticket } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPriorityBadge, getStatusBadge } from "@/app/tickets/page";

interface TicketDetailsCardProps {
  ticket: Ticket;
  className?: string;
}

export function TicketDetailsCard({
  ticket,
  className,
}: TicketDetailsCardProps) {
  return (
    <Card className={`shadow-sm border-slate-200 ${className || ""}`}>
      <CardHeader className="py-3.5 px-4 border-b bg-slate-50 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold text-slate-800">
          Ticket #{ticket.id}
        </CardTitle>
        {getStatusBadge(ticket.status)}
      </CardHeader>
      <CardContent className="p-4 space-y-4 text-sm divide-y divide-slate-100">
        {/* Customer Info */}
        <div className="flex items-start gap-3 pt-0">
          <div className="p-1.5 rounded-md bg-slate-100 text-slate-500 mt-0.5">
            <User className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Customer
            </div>
            <div className="font-medium text-slate-900 truncate">
              {ticket.customer?.name || "Unknown"}
            </div>
            {ticket.customer?.email && (
              <div className="text-xs text-slate-500 truncate">
                {ticket.customer.email}
              </div>
            )}
          </div>
        </div>

        {/* Assignee Info */}
        <div className="flex items-start gap-3 pt-3">
          <div className="p-1.5 rounded-md bg-slate-100 text-slate-500 mt-0.5">
            <UserCheck className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Assignee
            </div>
            <div className="font-medium text-slate-900 truncate">
              {ticket.assigned_agent ? (
                ticket.assigned_agent.name
              ) : (
                <span className="text-slate-400 italic font-normal">
                  Unassigned
                </span>
              )}
            </div>
            {ticket.assigned_agent?.email && (
              <div className="text-xs text-slate-500 truncate">
                {ticket.assigned_agent.email}
              </div>
            )}
          </div>
        </div>

        {/* Category & Priority */}
        <div className="grid grid-cols-2 gap-3 pt-3">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Category
            </div>
            <div className="font-medium text-slate-900 capitalize text-xs bg-slate-50 px-2 py-1 rounded border border-slate-200 inline-block">
              {ticket.category}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Priority
            </div>
            <div>{getPriorityBadge(ticket.priority)}</div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="pt-3 space-y-1.5 text-xs text-slate-500">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Created:</span>
            <span className="font-medium text-slate-700">
              {new Date(ticket.created_at).toLocaleDateString([], {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Updated:</span>
            <span className="font-medium text-slate-700">
              {new Date(ticket.updated_at).toLocaleDateString([], {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
