import { Zap, UserCheck, RotateCcw } from "lucide-react";
import { Ticket, Status } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useTicketActions } from "@/hooks/useTicketActions";

export interface MobileActionsMenuProps {
  menuRef: React.RefObject<HTMLDivElement | null>;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  ticket?: Ticket;
}

export function MobileActionsMenu({
  menuRef,
  isOpen,
  onToggle,
  onClose,
  ticket,
}: MobileActionsMenuProps) {
  const { user } = useAuth();
  const { takeTicket, isTakingTicket, updateStatus, isUpdatingStatus } =
    useTicketActions(ticket?.id);

  const userRole = user?.role;
  const isAgentOrAdmin = userRole === "agent" || userRole === "admin";
  const isCustomer = userRole === "customer";
  const isTicketTaken = !!ticket?.assigned_agent_id;
  const isClosed = ticket?.status === "closed";

  // Ada aksi tombol yang perlu diambil (Take Ticket atau Reopen Ticket)
  const hasPendingAction = isAgentOrAdmin
    ? !isTicketTaken && !isClosed
    : ticket?.status === "resolved";

  return (
    <div className="relative" ref={menuRef}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shrink-0"
        title={hasPendingAction ? "Ticket Actions" : "No action required"}
        onClick={onToggle}
      >
        <Zap
          className={`h-4 w-4 ${
            hasPendingAction ? "text-amber-600" : "text-slate-400"
          }`}
        />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 p-3 z-30 animate-in fade-in zoom-in-95 duration-150">
          <div className="text-[11px] font-semibold text-slate-400 uppercase mb-2">
            Ticket Actions
          </div>

          {/* Agent / Admin Actions */}
          {isAgentOrAdmin && (
            <div className="space-y-3">
              {!isTicketTaken ? (
                <Button
                  type="button"
                  onClick={() => {
                    takeTicket();
                    onClose();
                  }}
                  className="w-full justify-center text-xs h-8.5 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs"
                  disabled={isTakingTicket || isClosed}
                >
                  <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                  {isTakingTicket ? "Taking Ticket..." : "Take Ticket"}
                </Button>
              ) : (
                <div className="py-2.5 px-3 rounded-md bg-slate-50 border border-slate-100 text-center">
                  <span className="text-xs font-semibold text-slate-600 block">
                    - No action required -
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Ticket already taken by{" "}
                    {ticket?.assigned_agent?.name || "agent"}
                  </span>
                </div>
              )}

              {!isClosed ? (
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase">
                    Change Status
                  </label>
                  <Select
                    value={ticket?.status}
                    onValueChange={(val) => {
                      if (val && val !== ticket?.status) {
                        updateStatus(val as Status);
                        setTimeout(() => {
                          onClose();
                        }, 100);
                      }
                    }}
                    disabled={isUpdatingStatus}
                  >
                    <SelectTrigger className="h-8 text-xs bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-50">
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="text-center text-[11px] text-slate-400 pt-1">
                  Ticket status is closed
                </div>
              )}
            </div>
          )}

          {/* Customer Actions */}
          {isCustomer && (
            <div>
              {ticket?.status === "resolved" ? (
                <Button
                  type="button"
                  onClick={() => {
                    updateStatus("open");
                    onClose();
                  }}
                  className="w-full text-xs h-8.5 justify-center bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-xs"
                  disabled={isUpdatingStatus}
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  {isUpdatingStatus ? "Reopening..." : "Reopen Ticket"}
                </Button>
              ) : (
                <div className="py-3 px-2 text-center rounded-md bg-slate-50 border border-slate-100 text-slate-500">
                  <span className="text-xs font-semibold text-slate-600 block">
                    - No action required -
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    {ticket?.status === "closed"
                      ? "This ticket is closed."
                      : isTicketTaken
                        ? `Ticket already taken by ${
                            ticket?.assigned_agent?.name || "agent"
                          }.`
                        : "No actions available right now."}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
