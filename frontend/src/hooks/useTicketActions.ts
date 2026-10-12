"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { api } from "@/lib/axios";
import { Status } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

export function useTicketActions(ticketId?: string | number) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const updateStatusMutation = useMutation({
    mutationFn: async (status: Status) => {
      if (!ticketId) throw new Error("Ticket ID is required");
      const { data } = await api.patch(`/api/v1/tickets/${ticketId}`, {
        status,
      });
      return data;
    },
    onSuccess: () => {
      toast.success("Ticket status updated successfully");
      if (ticketId) {
        queryClient.invalidateQueries({
          queryKey: ["ticket", String(ticketId)],
        });
        queryClient.invalidateQueries({
          queryKey: ["ticket", Number(ticketId)],
        });
        queryClient.invalidateQueries({ queryKey: ["tickets"] });
      }
    },
    onError: (error: AxiosError<{ detail?: string }>) => {
      toast.error(
        error.response?.data?.detail || "Failed to update ticket status",
      );
    },
  });

  const takeTicketMutation = useMutation({
    mutationFn: async () => {
      if (!ticketId) throw new Error("Ticket ID is required");
      if (!user) throw new Error("User not authenticated");
      const { data } = await api.patch(`/api/v1/tickets/${ticketId}`, {
        assigned_agent_id: user.id,
      });
      return data;
    },
    onSuccess: () => {
      toast.success("Ticket assigned to you");
      if (ticketId) {
        queryClient.invalidateQueries({
          queryKey: ["ticket", String(ticketId)],
        });
        queryClient.invalidateQueries({
          queryKey: ["ticket", Number(ticketId)],
        });
        queryClient.invalidateQueries({ queryKey: ["tickets"] });
      }
    },
    onError: (error: AxiosError<{ detail?: string }>) => {
      toast.error(error.response?.data?.detail || "Failed to assign ticket");
    },
  });

  return {
    updateStatus: (status: Status) => updateStatusMutation.mutate(status),
    isUpdatingStatus: updateStatusMutation.isPending,
    takeTicket: () => takeTicketMutation.mutate(),
    isTakingTicket: takeTicketMutation.isPending,
  };
}
