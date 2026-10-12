import { Message } from "@/types";

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
}

export function MessageBubble({ message, isMe }: MessageBubbleProps) {
  return (
    <div
      className={`flex flex-col ${
        isMe ? "items-end ml-auto" : "items-start"
      } gap-1 max-w-[85%] sm:max-w-[75%] md:max-w-lg lg:max-w-xl`}
    >
      <div className="text-[11px] text-slate-500 flex items-center gap-1 px-1">
        <span className="font-semibold text-slate-700">
          {isMe ? "You" : message.sender?.name || "Unknown"}
        </span>
        <span className="uppercase opacity-60">
          ({message.sender?.role || "system"})
        </span>
        <span className="opacity-60 ml-2">
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      <div
        className={`p-3 rounded-lg text-sm shadow-sm whitespace-pre-wrap break-words [overflow-wrap:anywhere] max-w-full leading-relaxed ${
          isMe
            ? "bg-blue-600 text-white rounded-tr-none"
            : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
        }`}
      >
        {message.body}
      </div>
    </div>
  );
}
