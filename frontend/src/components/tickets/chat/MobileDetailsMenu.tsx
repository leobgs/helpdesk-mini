import { Info } from "lucide-react";
import { Ticket } from "@/types";
import { Button } from "@/components/ui/button";
import { getPriorityBadge, getStatusBadge } from "@/app/tickets/page";

export interface MobileDetailsMenuProps {
  menuRef: React.RefObject<HTMLDivElement | null>;
  isOpen: boolean;
  onToggle: () => void;
  ticket?: Ticket;
}

export function MobileDetailsMenu({
  menuRef,
  isOpen,
  onToggle,
  ticket,
}: MobileDetailsMenuProps) {
  return (
    <div className="relative" ref={menuRef}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
        title="Ticket Details"
        onClick={onToggle}
      >
        <Info className="h-4 w-4 text-blue-600" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 p-3.5 z-30 animate-in fade-in zoom-in-95 duration-150 text-xs">
          <div className="flex items-center justify-between pb-2 mb-2 border-b">
            <span className="font-semibold text-slate-800 text-xs">
              Ticket #{ticket?.id}
            </span>
            {ticket?.status && getStatusBadge(ticket.status)}
          </div>

          <div className="space-y-2 text-slate-600">
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-400">
                Customer
              </div>
              <div className="font-medium text-slate-900">
                {ticket?.customer?.name || "Unknown"}
              </div>
              {ticket?.customer?.email && (
                <div className="text-[11px] text-slate-500 truncate">
                  {ticket.customer.email}
                </div>
              )}
            </div>

            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-400">
                Assignee
              </div>
              <div className="font-medium text-slate-900">
                {ticket?.assigned_agent?.name || "Unassigned"}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-[10px] uppercase font-semibold text-slate-400">
                  Category
                </div>
                <div className="font-medium text-slate-900 capitalize">
                  {ticket?.category || "-"}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-semibold text-slate-400">
                  Priority
                </div>
                <div className="mt-0.5">
                  {ticket?.priority && getPriorityBadge(ticket.priority)}
                </div>
              </div>
            </div>

            {ticket?.created_at && (
              <div className="pt-1.5 border-t">
                <div className="text-[10px] uppercase font-semibold text-slate-400">
                  Created At
                </div>
                <div className="text-slate-600 text-[11px]">
                  {new Date(ticket.created_at).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
