"use client";

import { Ticket, Status, Role } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TicketActionsCardProps {
  ticket: Ticket;
  userRole?: Role;
  onTakeTicket: () => void;
  isTakingTicket?: boolean;
  onStatusChange: (status: Status) => void;
  isUpdatingStatus?: boolean;
  className?: string;
}

export function TicketActionsCard({
  ticket,
  userRole,
  onTakeTicket,
  isTakingTicket = false,
  onStatusChange,
  isUpdatingStatus = false,
  className,
}: TicketActionsCardProps) {
  const isAgentOrAdmin = userRole === "agent" || userRole === "admin";
  const isCustomer = userRole === "customer";

  return (
    <Card className={`shadow-sm border-slate-200 ${className || ""}`}>
      <CardHeader className="py-4 border-b">
        <CardTitle className="text-sm font-semibold">Actions</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {/* Agent / Admin Actions */}
        {isAgentOrAdmin && (
          <>
            {!ticket.assigned_agent_id && (
              <Button
                onClick={onTakeTicket}
                variant="outline"
                className="w-full justify-start"
                disabled={isTakingTicket}
              >
                {isTakingTicket ? "Taking Ticket..." : "Take Ticket"}
              </Button>
            )}

            <div className="space-y-2 pt-2">
              <label className="text-xs font-medium text-slate-500 uppercase">
                Change Status
              </label>
              <Select
                value={ticket.status}
                onValueChange={(val) => onStatusChange(val as Status)}
                disabled={isUpdatingStatus}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Customer Actions */}
        {isCustomer && ticket.status === "resolved" && (
          <Button
            onClick={() => onStatusChange("open")}
            variant="outline"
            className="w-full"
            disabled={isUpdatingStatus}
          >
            {isUpdatingStatus ? "Reopening..." : "Reopen Ticket"}
          </Button>
        )}

        {isCustomer &&
          ticket.status !== "resolved" &&
          ticket.status !== "closed" && (
            <div className="text-xs text-slate-500 text-center">
              No actions available
            </div>
          )}

        {isCustomer && ticket.status === "closed" && (
          <div className="text-xs text-slate-500 text-center">
            This ticket is closed
          </div>
        )}
      </CardContent>
    </Card>
  );
}
