"use client";

import { Ticket } from "@/types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface TicketDetailsCardProps {
  ticket: Ticket;
  className?: string;
}

export function TicketDetailsCard({ ticket, className }: TicketDetailsCardProps) {
  return (
    <Card className={`shadow-sm border-slate-200 ${className || ""}`}>
      <CardHeader className="py-4 border-b">
        <CardTitle className="text-sm font-semibold">Details</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-slate-500 mb-1 text-xs uppercase font-medium">
              Customer
            </div>
            <div className="font-medium text-slate-900">
              {ticket.customer?.name || "Unknown"}
            </div>
          </div>
          <div>
            <div className="text-slate-500 mb-1 text-xs uppercase font-medium">
              Assignee
            </div>
            <div className="font-medium text-slate-900">
              {ticket.assigned_agent?.name || "Unassigned"}
            </div>
          </div>
          <div>
            <div className="text-slate-500 mb-1 text-xs uppercase font-medium">
              Category
            </div>
            <div className="font-medium text-slate-900 capitalize">
              {ticket.category}
            </div>
          </div>
          <div>
            <div className="text-slate-500 mb-1 text-xs uppercase font-medium">
              Priority
            </div>
            <Badge variant="outline" className="uppercase text-xs">
              {ticket.priority}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
