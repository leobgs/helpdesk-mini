'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/auth/AuthGuard';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <nav className="bg-white shadow-sm border-b px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link href="/" className="font-bold text-xl text-slate-800">
          HelpDesk Mini
        </Link>
        
        <div className="flex gap-4">
          <Link href="/tickets" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Tickets
          </Link>
          <RoleGuard allowedRoles={['admin']}>
            <Link href="/admin/users" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              Users
            </Link>
          </RoleGuard>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-sm text-slate-500">
          <span className="font-semibold text-slate-700">{user.name}</span> ({user.role})
        </div>
        <Button variant="outline" size="sm" onClick={logout}>
          Logout
        </Button>
      </div>
    </nav>
  );
}
