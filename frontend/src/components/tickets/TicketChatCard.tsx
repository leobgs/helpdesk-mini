"use client";

import { useState, useRef, useEffect } from "react";
import { Message } from "@/types";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type WebSocketStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

interface TicketChatCardProps {
  messages: Message[];
  currentUserId?: number;
  wsStatus: WebSocketStatus;
  typingUsers: string[];
  isClosed: boolean;
  onSendMessage: (text: string) => Promise<void>;
  isSending: boolean;
  onTyping: () => void;
  className?: string;
}

export function TicketChatCard({
  messages,
  currentUserId,
  wsStatus,
  typingUsers,
  isClosed,
  onSendMessage,
  isSending,
  onTyping,
  className,
}: TicketChatCardProps) {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const resetTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const adjustTextareaHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const handleSubmit = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    const text = newMessage.trim();
    if (!text || isSending || isClosed) return;

    setNewMessage("");
    resetTextareaHeight();
    await onSendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      // Shift + Enter: creates newline (default textarea behavior)
      if (e.shiftKey) {
        return;
      }

      // Mobile check: on mobile virtual keyboards, Return creates newline,
      // and send button is tapped to send.
      const isMobile =
        typeof window !== "undefined" && window.innerWidth < 768;
      if (isMobile) {
        return;
      }

      // On desktop: Enter sends message immediately
      if (e.nativeEvent.isComposing) return;
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Card
      className={`flex flex-col shadow-sm border-slate-200 min-h-150 h-full ${
        className || ""
      }`}
    >
      <CardHeader className="py-4 border-b bg-slate-50">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          Conversation
          {wsStatus === "connected" && (
            <Badge
              variant="outline"
              className="text-[10px] text-emerald-600 border-emerald-300"
            >
              Live
            </Badge>
          )}
          {wsStatus === "disconnected" && (
            <Badge
              variant="outline"
              className="text-[10px] text-amber-600 border-amber-300"
            >
              Offline (HTTP fallback)
            </Badge>
          )}
          {wsStatus === "connecting" && (
            <Badge variant="secondary" className="text-[10px]">
              Connecting...
            </Badge>
          )}
          {wsStatus === "error" && (
            <Badge
              variant="outline"
              className="text-[10px] text-amber-600 border-amber-300"
            >
              Error (HTTP fallback)
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((msg) => {
          const isMe = msg.sender?.id === currentUserId;
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${
                isMe ? "items-end ml-auto" : "items-start"
              } gap-1 max-w-[85%] sm:max-w-[75%] md:max-w-lg lg:max-w-xl`}
            >
              <div className="text-[11px] text-slate-500 flex items-center gap-1 px-1">
                <span className="font-semibold text-slate-700">
                  {isMe ? "You" : msg.sender?.name || "Unknown"}
                </span>
                <span className="uppercase opacity-60">
                  ({msg.sender?.role || "system"})
                </span>
                <span className="opacity-60 ml-2">
                  {new Date(msg.created_at).toLocaleTimeString([], {
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
                {msg.body}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </CardContent>

      {typingUsers.length > 0 && (
        <div className="px-4 py-2 text-xs text-slate-500 italic bg-slate-50/50 border-t">
          {typingUsers.join(", ")} {typingUsers.length > 1 ? "are" : "is"}{" "}
          typing...
        </div>
      )}

      <div className="p-4 bg-white border-t">
        {isClosed ? (
          <div className="text-center text-sm text-slate-500 py-2">
            This ticket is closed. No further messages can be sent.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-1.5">
            <div className="flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  adjustTextareaHeight();
                  onTyping();
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="min-h-[42px] max-h-36 resize-none py-2.5 text-sm flex-1 leading-relaxed"
                disabled={isSending}
                rows={1}
              />
              <Button
                type="submit"
                size="icon"
                className="h-[42px] w-[42px] shrink-0"
                disabled={!newMessage.trim() || isSending}
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="hidden md:flex justify-between items-center px-1 text-[11px] text-slate-400">
              <span>
                Tekan{" "}
                <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 text-slate-600 font-mono text-[10px]">
                  Enter
                </kbd>{" "}
                untuk kirim,{" "}
                <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 text-slate-600 font-mono text-[10px]">
                  Shift + Enter
                </kbd>{" "}
                untuk baris baru
              </span>
            </div>
          </form>
        )}
      </div>
    </Card>
  );
}
