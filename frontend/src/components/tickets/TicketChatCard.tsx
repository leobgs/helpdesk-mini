"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { Message, Ticket } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPriorityBadge } from "@/app/tickets/page";
import { useAuth } from "@/contexts/AuthContext";
import {
  LiveStatusBadge,
  MobileActionsMenu,
  MobileDetailsMenu,
  MessageBubble,
  WebSocketStatus,
} from "./chat";

export type { WebSocketStatus };

interface TicketChatCardProps {
  ticket?: Ticket;
  messages: Message[];
  wsStatus: WebSocketStatus;
  typingUsers: string[];
  onSendMessage: (text: string) => Promise<void>;
  isSending: boolean;
  onTyping: () => void;
  className?: string;
}

export function TicketChatCard({
  ticket,
  messages,
  wsStatus,
  typingUsers,
  onSendMessage,
  isSending,
  onTyping,
  className,
}: TicketChatCardProps) {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showDetailsCard, setShowDetailsCard] = useState(false);

  const actionsDropdownRef = useRef<HTMLDivElement>(null);
  const detailsDropdownRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isClosed = ticket?.status === "closed";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        actionsDropdownRef.current &&
        !actionsDropdownRef.current.contains(event.target as Node)
      ) {
        setShowActionsMenu(false);
      }
      if (
        detailsDropdownRef.current &&
        !detailsDropdownRef.current.contains(event.target as Node)
      ) {
        setShowDetailsCard(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const adjustTextareaHeight = (reset = false) => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = reset ? "auto" : `${Math.min(el.scrollHeight, 160)}px`;
  };

  const handleSubmit = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    const text = newMessage.trim();
    if (!text || isSending || isClosed) return;

    setNewMessage("");
    adjustTextareaHeight(true);
    await onSendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      if (e.shiftKey) return;

      // On mobile virtual keyboard, Return creates a newline; on desktop, Enter sends message
      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
      if (isMobile) return;

      if (e.nativeEvent.isComposing) return;
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const chatPartnerName =
    user?.role === "customer"
      ? ticket?.assigned_agent?.name || "Unassigned Agent"
      : ticket?.customer?.name || "Customer";

  return (
    <Card
      className={`flex flex-col shadow-sm border-slate-200 min-h-150 h-full ${
        className || ""
      }`}
    >
      <CardHeader className="py-3.5 px-4 border-b bg-slate-50">
        <div className="hidden lg:flex items-center justify-between w-full">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Conversation
          </CardTitle>
          <LiveStatusBadge status={wsStatus} />
        </div>

        <div className="flex lg:hidden items-center justify-between w-full">
          <div className="flex flex-col text-left min-w-0 pr-2">
            <div className="font-semibold text-slate-900 text-sm truncate">
              {chatPartnerName}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
              <span className="text-[11px] font-medium text-slate-400 uppercase">
                Priority:
              </span>
              {ticket?.priority ? (
                getPriorityBadge(ticket.priority)
              ) : (
                <span className="font-medium text-slate-700">-</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <MobileActionsMenu
              menuRef={actionsDropdownRef}
              isOpen={showActionsMenu}
              onToggle={() => {
                setShowActionsMenu((prev) => !prev);
                setShowDetailsCard(false);
              }}
              onClose={() => setShowActionsMenu(false)}
              ticket={ticket}
            />

            <MobileDetailsMenu
              menuRef={detailsDropdownRef}
              isOpen={showDetailsCard}
              onToggle={() => {
                setShowDetailsCard((prev) => !prev);
                setShowActionsMenu(false);
              }}
              ticket={ticket}
            />
          </div>
        </div>
      </CardHeader>

      <div className="relative flex-1 min-h-0 flex flex-col">
        {/* Floating badge pinned outside scrollable container to prevent scrolling with messages */}
        <div className="lg:hidden absolute -top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <LiveStatusBadge status={wsStatus} isFloating />
        </div>

        <CardContent className="flex-1 overflow-y-auto p-4 pt-9 lg:pt-4 space-y-4 bg-slate-50/50">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isMe={msg.sender?.id === user?.id}
            />
          ))}
          <div ref={messagesEndRef} />
        </CardContent>
      </div>

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
                Press{" "}
                <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 text-slate-600 font-mono text-[10px]">
                  Enter
                </kbd>{" "}
                to send,{" "}
                <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 text-slate-600 font-mono text-[10px]">
                  Shift + Enter
                </kbd>{" "}
                for a new line
              </span>
            </div>
          </form>
        )}
      </div>
    </Card>
  );
}
