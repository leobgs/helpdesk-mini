export type Role = 'admin' | 'agent' | 'customer';
export type Priority = 'low' | 'medium' | 'high';
export type Status = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface Business {
  id: number;
  name: string;
  slug: string;
  created_at: string;
}

export interface User {
  id: number;
  business_id: number;
  name: string;
  email: string;
  role: Role;
  created_at: string;
}

export interface Ticket {
  id: number;
  business_id: number;
  customer_id: number;
  assigned_agent_id: number | null;
  subject: string;
  category: string;
  priority: Priority;
  status: Status;
  created_at: string;
  updated_at: string;
  customer?: User;
  assigned_agent?: User;
}

export interface Message {
  id: number;
  ticket_id: number;
  sender_id: number;
  body: string;
  created_at: string;
  sender?: User;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
