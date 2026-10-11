'use client';

import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import axios from 'axios';

const handleError = (error: Error, meta?: Record<string, unknown>) => {
  if (meta?.ignoreGlobalToast) return;

  if (axios.isAxiosError(error)) {
    if (error.response) {
      const status = error.response.status;
      const detail = error.response.data?.detail || error.message;
      const description = typeof detail === "string" ? detail : undefined;

      if (status === 401) {
        toast.error("Session Expired", { description: "Please log in again." });
      } else if (status === 403) {
        toast.error("Access Denied (403)", { description: "You do not have permission to perform this action." });
      } else if (status === 404) {
        toast.error("Not Found (404)", { description: "The requested data was not found." });
      } else if (status === 422) {
        toast.error("Validation Error (422)", { description: description || "The submitted data is invalid." });
      } else if (status >= 400 && status < 500) {
        toast.error(`Request Failed (${status})`, { description });
      } else if (status >= 500) {
        toast.error(`Server Error (${status})`, { description: "An internal server error occurred." });
      }
    } else if (error.request) {
      toast.error("Network Error", { description: "Unable to connect to the server. Please check your internet connection." });
    } else {
      toast.error("Error", { description: error.message });
    }
  } else {
    toast.error("Unexpected Error", { description: error.message });
  }
};

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => handleError(error, query.meta),
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => handleError(error, mutation.meta),
    }),
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
