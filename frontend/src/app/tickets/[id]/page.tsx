"use client";

import { useState, useEffect, useRef, use } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { Send, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { api } from "@/lib/axios";
import { Ticket, Message, Status } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [wsStatus, setWsStatus] = useState<
    "connecting" | "connected" | "disconnected" | "error"
  >("connecting");
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // Fetch initial messages
  const { data: initialMessages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ["ticket-messages", id],
    queryFn: async () => {
      const { data } = await api.get<Message[]>(
        `/api/v1/tickets/${id}/messages`,
      );
      return data;
    },
    enabled: !!ticket,
  });

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // WebSocket connection
  useEffect(() => {
    if (!ticket) return;

    const token = Cookies.get("access_token");
    if (!token) return;

    const wsUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/tickets/ws/${id}?token=${token}`;
    const wsUrlStr = wsUrl
      .replace("http://", "ws://")
      .replace("https://", "wss://");

    const socket = new WebSocket(wsUrlStr);

    socket.onopen = () => {
      setWsStatus("connected");
    };

    socket.onmessage = (event) => {
      console.log(event, "eventss");
      const msg = JSON.parse(event.data);
      if (msg.type === "message") {
        setMessages((prev) => [...prev, msg.data]);
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
        // Update ticket status in react query cache
        queryClient.setQueryData(["ticket", id], (old: any) => ({
          ...old,
          status: msg.status,
        }));
      } else if (msg.type === "error") {
        console.error("WebSocket error message:", msg.message);
      }
    };

    socket.onclose = () => {
      setWsStatus("disconnected");
    };

    socket.onerror = () => {
      setWsStatus("error");
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [id, ticket, queryClient]);

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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !ws || ws.readyState !== WebSocket.OPEN) return;

    ws.send(JSON.stringify({ body: newMessage }));
    setNewMessage("");

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    ws.send(JSON.stringify({ type: "typing", is_typing: false }));
  };

  const handleUpdateStatus = async (status: Status) => {
    try {
      await api.patch(`/api/v1/tickets/${id}`, { status });
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  const handleTakeTicket = async () => {
    if (!user) return;
    try {
      await api.patch(`/api/v1/tickets/${id}`, { assigned_agent_id: user.id });
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
    } catch (error) {
      console.error("Failed to take ticket", error);
    }
  };

  const isClosed = ticket?.status === "closed";

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)] min-h-[600px]">
        {/* Chat Panel */}
        <Card className="lg:col-span-2 flex flex-col shadow-sm border-slate-200 h-full">
          <CardHeader className="py-4 border-b bg-slate-50">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Conversation
              {wsStatus === "disconnected" && (
                <Badge variant="destructive" className="text-[10px]">
                  Offline
                </Badge>
              )}
              {wsStatus === "connecting" && (
                <Badge variant="secondary" className="text-[10px]">
                  Connecting...
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
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"} gap-1 max-w-[80%] ${isMe ? "ml-auto" : ""}`}
                >
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
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
                    className={`p-3 rounded-lg text-sm shadow-sm whitespace-pre-wrap ${
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
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  placeholder="Type your message..."
                  className="flex-1"
                  disabled={wsStatus !== "connected"}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!newMessage.trim() || wsStatus !== "connected"}
                >
                  <Send className="h-4 w-4" />
                </Button>
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
                      onClick={handleTakeTicket}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      Take Ticket
                    </Button>
                  )}

                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-medium text-slate-500 uppercase">
                      Change Status
                    </label>
                    <Select
                      value={ticket.status}
                      onValueChange={(val) => handleUpdateStatus(val as Status)}
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
                  onClick={() => handleUpdateStatus("open")}
                  variant="outline"
                  className="w-full"
                >
                  Reopen Ticket
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
