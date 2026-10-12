"use client";

import { useState, useEffect, useRef, use, Suspense, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { Send, ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { api } from "@/lib/axios";
import { Ticket, Message, Status, PaginatedMessages } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";

import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-100px)] items-center justify-center">
          <div className="animate-pulse text-slate-500 font-medium">
            Loading ticket page...
          </div>
        </div>
      }
    >
      <TicketDetailContent params={params} />
    </Suspense>
  );
}

function TicketDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [wsStatus, setWsStatus] = useState<
    "connecting" | "connected" | "disconnected" | "error"
  >("connecting");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Fetch ticket details
  const {
    data: ticket,
    isLoading: isLoadingTicket,
    isError: isTicketError,
  } = useQuery({
    queryKey: ["ticket", id],
    queryFn: async () => {
      const { data } = await api.get<Ticket>(`/api/v1/tickets/${id}`);
      return data;
    },
    retry: false,
  });

  // Fetch initial messages with support for list or paginated response
  const {
    data: initialMessages,
    isLoading: isLoadingMessages,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ["ticket-messages", id],
    queryFn: async () => {
      const { data } = await api.get<Message[] | PaginatedMessages>(
        `/api/v1/tickets/${id}/messages`,
      );
      if (Array.isArray(data)) {
        return data;
      }
      return data?.data || [];
    },
    enabled: !!ticket,
  });

  const addMessage = useCallback((msg: Message) => {
    if (!msg?.id) return;
    setMessages((prev) =>
      prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
    );
  }, []);

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // WebSocket connection with automatic reconnection
  useEffect(() => {
    if (!ticket) return;

    const token = Cookies.get("access_token");
    if (!token) return;

    let isSubscribed = true;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let socket: WebSocket | null = null;

    const connectWebSocket = () => {
      if (!isSubscribed) return;

      const wsUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/tickets/ws/${id}?token=${token}`;
      const wsUrlStr = wsUrl
        .replace("http://", "ws://")
        .replace("https://", "wss://");

      setWsStatus("connecting");
      socket = new WebSocket(wsUrlStr);

      socket.onopen = () => {
        if (!isSubscribed) return;
        setWsStatus("connected");
        // Refetch to sync messages that may have arrived while disconnected
        refetchMessages();
      };

      socket.onmessage = (event) => {
        if (!isSubscribed) return;
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "message") {
            addMessage(msg.data);
          } else if (msg.type === "typing") {
            if (msg.data.user_id !== user?.id) {
              setTypingUsers((prev) => {
                if (msg.data.is_typing) {
                  return prev.includes(msg.data.name)
                    ? prev
                    : [...prev, msg.data.name];
                } else {
                  return prev.filter((name) => name !== msg.data.name);
                }
              });
            }
          } else if (msg.type === "status_changed") {
            queryClient.setQueryData(["ticket", id], (old: any) => ({
              ...old,
              status: msg.status,
            }));
          } else if (msg.type === "error") {
            console.error("WebSocket error message:", msg.message);
          }
        } catch (e) {
          console.error("Failed to parse websocket event:", e);
        }
      };

      socket.onclose = (event) => {
        if (!isSubscribed) return;
        setWsStatus("disconnected");
        // Auto-reconnect after 3 seconds if not a normal closure
        if (event.code !== 1000 && event.code !== 1008) {
          reconnectTimeout = setTimeout(connectWebSocket, 3000);
        }
      };

      socket.onerror = () => {
        if (!isSubscribed) return;
        setWsStatus("error");
      };

      setWs(socket);
    };

    connectWebSocket();

    return () => {
      isSubscribed = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socket) {
        socket.close(1000);
      }
    };
  }, [id, ticket, user?.id, queryClient, refetchMessages, addMessage]);

  const handleTyping = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    ws.send(JSON.stringify({ type: "typing", is_typing: true }));

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "typing", is_typing: false }));
      }
    }, 2000);
  };

  const isClosed = ticket?.status === "closed";

  const handleSendMessage = async (
    e?: React.FormEvent | React.KeyboardEvent,
  ) => {
    if (e) e.preventDefault();
    const text = newMessage.trim();
    if (!text || isSending || isClosed) return;

    setNewMessage("");
    resetTextareaHeight();

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "typing", is_typing: false }));
      ws.send(JSON.stringify({ body: text }));
    } else {
      // Fallback: send via REST HTTP API if WebSocket is offline
      try {
        setIsSending(true);
        const { data } = await api.post<Message>(
          `/api/v1/tickets/${id}/messages`,
          { body: text },
        );
        addMessage(data);
      } catch (error) {
        toast.error("Failed to send message. Please try again.");
      } finally {
        setIsSending(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        return;
      }

      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
      if (isMobile) {
        return;
      }

      if (e.nativeEvent.isComposing) return;
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // Update ticket status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status: Status) => {
      const { data } = await api.patch(`/api/v1/tickets/${id}`, { status });
      return data;
    },
    onSuccess: () => {
      toast.success("Ticket status updated successfully");
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
    },
  });

  // Assign ticket to current agent mutation
  const takeTicketMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { data } = await api.patch(`/api/v1/tickets/${id}`, {
        assigned_agent_id: user.id,
      });
      return data;
    },
    onSuccess: () => {
      toast.success("Ticket assigned to you");
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
    },
  });

  if (isLoadingTicket || isLoadingMessages)
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center">
        <div className="animate-pulse text-slate-500 font-medium">
          Loading ticket details...
        </div>
      </div>
    );

  if (isTicketError || !ticket)
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center flex-col gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h2 className="text-xl font-bold text-slate-800">Ticket Not Found</h2>
        <p className="text-slate-500">
          You do not have access to this ticket or it does not exist.
        </p>
        <Link
          href="/tickets"
          className={buttonVariants({ variant: "default" })}
        >
          Back to Tickets
        </Link>
      </div>
    );

  return (
    <AuthGuard>
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/tickets"
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
          #{ticket.id} - {ticket.subject}
          <Badge variant="secondary" className="uppercase text-xs">
            {ticket.status.replace("_", " ")}
          </Badge>
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)] min-h-150">
        {/* Chat Panel */}
        <Card className="lg:col-span-2 flex flex-col shadow-sm border-slate-200 min-h-150 h-full">
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
              const isMe = msg.sender?.id === user?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? "items-end ml-auto" : "items-start"} gap-1 max-w-[85%] sm:max-w-[75%] md:max-w-lg lg:max-w-xl`}
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
              <form onSubmit={handleSendMessage} className="space-y-1.5">
                <div className="flex items-end gap-2">
                  <Textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      adjustTextareaHeight();
                      handleTyping();
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

        {/* Ticket Info Panel */}
        <div className="space-y-6">
          <Card className="shadow-sm border-slate-200">
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
                    {ticket.customer?.name}
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

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-sm font-semibold">Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {/* Agent / Admin Actions */}
              {(user?.role === "agent" || user?.role === "admin") && (
                <>
                  {!ticket.assigned_agent_id && (
                    <Button
                      onClick={() => takeTicketMutation.mutate()}
                      variant="outline"
                      className="w-full justify-start"
                      disabled={takeTicketMutation.isPending}
                    >
                      {takeTicketMutation.isPending
                        ? "Taking Ticket..."
                        : "Take Ticket"}
                    </Button>
                  )}

                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-medium text-slate-500 uppercase">
                      Change Status
                    </label>
                    <Select
                      value={ticket.status}
                      onValueChange={(val) =>
                        updateStatusMutation.mutate(val as Status)
                      }
                      disabled={updateStatusMutation.isPending}
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
              {user?.role === "customer" && ticket.status === "resolved" && (
                <Button
                  onClick={() => updateStatusMutation.mutate("open")}
                  variant="outline"
                  className="w-full"
                  disabled={updateStatusMutation.isPending}
                >
                  {updateStatusMutation.isPending
                    ? "Reopening..."
                    : "Reopen Ticket"}
                </Button>
              )}
              {user?.role === "customer" &&
                ticket.status !== "resolved" &&
                ticket.status !== "closed" && (
                  <div className="text-xs text-slate-500 text-center">
                    No actions available
                  </div>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}
