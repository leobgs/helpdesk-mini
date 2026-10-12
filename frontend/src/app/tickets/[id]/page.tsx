"use client";

import { useState, useEffect, useRef, use, Suspense, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";

import { api } from "@/lib/axios";
import { Ticket, Message, PaginatedMessages } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";

import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TicketDetailsCard,
  TicketActionsCard,
  TicketChatCard,
  WebSocketStatus,
} from "@/components/tickets";
import { getStatusBadge } from "../page";

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
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [wsStatus, setWsStatus] = useState<WebSocketStatus>("connecting");

  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const handleSendMessage = async (text: string) => {
    if (!text || isSending || isClosed) return;

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
          {getStatusBadge(ticket.status)}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)] min-h-150">
        {/* Chat Panel */}
        <TicketChatCard
          className="lg:col-span-2"
          ticket={ticket}
          messages={messages}
          wsStatus={wsStatus}
          typingUsers={typingUsers}
          onSendMessage={handleSendMessage}
          isSending={isSending}
          onTyping={handleTyping}
        />

        {/* Ticket Info & Actions Panel (Desktop Only) */}
        <div className="hidden lg:block lg:space-y-6">
          <TicketDetailsCard ticket={ticket} />
          <TicketActionsCard ticket={ticket} />
        </div>
      </div>
    </AuthGuard>
  );
}
