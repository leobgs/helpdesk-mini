import { Badge } from "@/components/ui/badge";

export type WebSocketStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

interface LiveStatusBadgeProps {
  status: WebSocketStatus;
  isFloating?: boolean;
}

export function LiveStatusBadge({
  status,
  isFloating = false,
}: LiveStatusBadgeProps) {
  if (isFloating) {
    if (status === "connected") {
      return (
        <div className="bg-white/90 backdrop-blur-md shadow-xs border border-emerald-200 text-emerald-700 text-[11px] font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1.5 animate-in fade-in duration-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </div>
      );
    }
    if (status === "disconnected") {
      return (
        <div className="bg-white/90 backdrop-blur-md shadow-xs border border-amber-200 text-amber-700 text-[11px] font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          Offline (HTTP fallback)
        </div>
      );
    }
    if (status === "connecting") {
      return (
        <div className="bg-white/90 backdrop-blur-md shadow-xs border border-slate-200 text-slate-600 text-[11px] font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-ping" />
          Connecting...
        </div>
      );
    }
    return (
      <div className="bg-white/90 backdrop-blur-md shadow-xs border border-red-200 text-red-700 text-[11px] font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        Error (HTTP fallback)
      </div>
    );
  }

  if (status === "connected") {
    return (
      <Badge
        variant="outline"
        className="text-[10px] text-emerald-600 border-emerald-300"
      >
        Live
      </Badge>
    );
  }
  if (status === "disconnected") {
    return (
      <Badge
        variant="outline"
        className="text-[10px] text-amber-600 border-amber-300"
      >
        Offline (HTTP fallback)
      </Badge>
    );
  }
  if (status === "connecting") {
    return (
      <Badge variant="secondary" className="text-[10px]">
        Connecting...
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="text-[10px] text-amber-600 border-amber-300"
    >
      Error (HTTP fallback)
    </Badge>
  );
}
