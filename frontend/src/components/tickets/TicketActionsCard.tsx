"use client";

import { UserCheck, RotateCcw, Loader2 } from "lucide-react";
import { Ticket, Status } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useTicketActions } from "@/hooks/useTicketActions";

interface TicketActionsCardProps {
  ticket: Ticket;
  className?: string;
}

export function TicketActionsCard({
  ticket,
  className,
}: TicketActionsCardProps) {
  const { user } = useAuth();
  const { takeTicket, isTakingTicket, updateStatus, isUpdatingStatus } =
    useTicketActions(ticket.id);

  const userRole = user?.role;
  const isAgentOrAdmin = userRole === "agent" || userRole === "admin";
  const isCustomer = userRole === "customer";
  const isTicketTaken = !!ticket.assigned_agent_id;
  const isClosed = ticket.status === "closed";

  return (
    <Card className={`shadow-sm border-slate-200 ${className || ""}`}>
      <CardHeader className="py-3.5 px-4 border-b bg-slate-50">
        <CardTitle className="text-sm font-semibold text-slate-800">
          Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Agent / Admin Actions */}
        {isAgentOrAdmin && (
          <div className="space-y-4">
            {!isTicketTaken ? (
              <Button
                onClick={takeTicket}
                className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs"
                disabled={isTakingTicket || isClosed}
              >
                {isTakingTicket ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <UserCheck className="h-4 w-4 mr-2" />
                )}
                {isTakingTicket ? "Taking Ticket..." : "Take Ticket"}
              </Button>
            ) : (
              <div className="py-2.5 px-3 rounded-md bg-slate-50 border border-slate-100 text-center">
                <span className="text-xs font-semibold text-slate-600 block">
                  - No action required -
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Ticket already taken by{" "}
                  {ticket.assigned_agent?.name || "agent"}
                </span>
              </div>
            )}

            {!isClosed ? (
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Change Status
                </label>
                <Select
                  value={ticket.status}
                  onValueChange={(val) => updateStatus(val as Status)}
                  disabled={isUpdatingStatus}
                >
                  <SelectTrigger className="h-9 text-xs bg-white border-slate-200">
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
            ) : (
              <div className="text-center text-xs text-slate-400">
                Ticket status is closed
              </div>
            )}
          </div>
        )}

        {/* Customer Actions */}
        {isCustomer && (
          <div>
            {ticket.status === "resolved" ? (
              <Button
                onClick={() => updateStatus("open")}
                className="w-full h-9 bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-xs"
                disabled={isUpdatingStatus}
              >
                {isUpdatingStatus ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4 mr-2" />
                )}
                {isUpdatingStatus ? "Reopening..." : "Reopen Ticket"}
              </Button>
            ) : (
              <div className="py-4 px-3 text-center rounded-md bg-slate-50 border border-slate-100 text-slate-500">
                <span className="text-xs font-semibold text-slate-600 block">
                  - No action required -
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  {ticket.status === "closed"
                    ? "This ticket is closed."
                    : isTicketTaken
                      ? `Ticket already taken by ${
                          ticket.assigned_agent?.name || "agent"
                        }.`
                      : "No actions available right now."}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
