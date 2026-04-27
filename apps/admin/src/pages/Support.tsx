import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import DetailModal from '../components/ui/DetailModal';
import { 
    HelpCircle, 
    MessageCircle, 
    User, 
    Clock, 
    CheckCircle, 
    AlertCircle,
    Shield,
    ExternalLink
} from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export default function Support() {
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['admin-tickets'],
    queryFn: async () => {
      const res = await api.get('/support/tickets');
      return res.data;
    },
  });

  const resolveMutation = useMutation({
      mutationFn: async (ticketId: string) => {
          return api.patch(`/support/tickets/${ticketId}`, { status: 'RESOLVED' });
      },
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
          toast.success('Ticket marked as resolved');
          setSelectedTicket(null);
      },
      onError: (err: any) => {
          toast.error(err.response?.data?.message || 'Failed to resolve ticket');
      }
  });

  const escalateMutation = useMutation({
    mutationFn: async (ticketId: string) => {
        return api.patch(`/support/tickets/${ticketId}`, { status: 'ESCALATED' });
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
        toast.success('Ticket escalated');
    }
  });

  const getStatusColor = (status: string) => {
      switch (status) {
          case 'RESOLVED': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
          case 'AI_TRIAGE': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
          case 'ESCALATED': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
          default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-textPrimary tracking-tight">Support Management</h2>
        <p className="text-textSecondary text-sm">Review and resolve platform support tickets and disputes.</p>
      </div>

      <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm transition-colors duration-300">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-background border-b border-border">
                <th className="px-6 py-4 text-left text-xs font-black text-textSecondary uppercase tracking-widest">User</th>
                <th className="px-6 py-4 text-left text-xs font-black text-textSecondary uppercase tracking-widest">Category</th>
                <th className="px-6 py-4 text-left text-xs font-black text-textSecondary uppercase tracking-widest">Subject</th>
                <th className="px-6 py-4 text-left text-xs font-black text-textSecondary uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-left text-xs font-black text-textSecondary uppercase tracking-widest">Created</th>
                <th className="px-6 py-4 text-right text-xs font-black text-textSecondary uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-textSecondary italic">Loading tickets...</td></tr>
              ) : tickets?.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-textSecondary">No support tickets found.</td></tr>
              ) : tickets.map((ticket: any) => (
                <tr key={ticket.id} className="hover:bg-background/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">
                            {ticket.user?.fullName?.[0] || ticket.user?.email?.[0]}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-textPrimary">{ticket.user?.fullName || 'User'}</p>
                            <p className="text-[10px] text-textSecondary">{ticket.user?.email}</p>
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-semibold text-textSecondary uppercase tracking-tight">
                        {ticket.category?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-textPrimary max-w-xs truncate">{ticket.subject}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest",
                        getStatusColor(ticket.status)
                    )}>
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-textSecondary font-medium">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedTicket(ticket)}
                      className="text-xs font-bold text-primary hover:text-primary-dark transition-colors px-4 py-2 bg-primary/10 rounded-xl"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <DetailModal
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title="Ticket Management"
      >
        {selectedTicket && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <MessageCircle size={24} />
                    </div>
                    <div>
                        <h4 className="text-xl font-bold text-textPrimary tracking-tight">{selectedTicket.subject}</h4>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-semibold text-textSecondary uppercase tracking-widest">{selectedTicket.category?.replace(/_/g, ' ')}</span>
                            <span className="text-xs text-textSecondary">•</span>
                            <span className="text-xs text-textSecondary italic">Ref: {selectedTicket.id.split('-')[0]}</span>
                        </div>
                    </div>
                </div>
                <div className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest",
                    getStatusColor(selectedTicket.status)
                )}>
                    {selectedTicket.status}
                </div>
            </div>

            <div className="space-y-2">
                <p className="text-[10px] font-black text-textSecondary uppercase tracking-widest px-1">Issue Description</p>
                <div className="p-4 bg-background border border-border rounded-2xl">
                    <p className="text-sm text-textPrimary leading-relaxed">
                        {selectedTicket.description || 'No description provided.'}
                    </p>
                </div>
            </div>

            <div className="bg-background rounded-3xl p-6 space-y-6 border border-border">
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-textSecondary uppercase tracking-widest">Customer</p>
                        <div className="flex items-center gap-2">
                            <User size={14} className="text-primary" />
                            <p className="text-sm font-bold text-textPrimary">{selectedTicket.user?.fullName || 'User'}</p>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-textSecondary uppercase tracking-widest">Date Reported</p>
                        <div className="flex items-center gap-2">
                            <Clock size={14} className="text-primary" />
                            <p className="text-sm font-bold text-textPrimary">{new Date(selectedTicket.createdAt).toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {selectedTicket.assignedAdmin && (
                     <div className="space-y-1 pt-4 border-t border-border">
                        <p className="text-[10px] font-black text-textSecondary uppercase tracking-widest">Assigned Agent</p>
                        <div className="flex items-center gap-2">
                            <Shield size={14} className="text-emerald-500" />
                            <p className="text-sm font-bold text-textPrimary">{selectedTicket.assignedAdmin.fullName || selectedTicket.assignedAdmin.email}</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <p className="text-[10px] font-black text-textPrimary uppercase tracking-widest px-2">Administrative Actions</p>
                <div className="grid grid-cols-1 gap-3">
                    <button 
                        onClick={() => window.open(`${window.location.origin}/chat/${selectedTicket.chatRoom?.id}`, '_blank')}
                        className="w-full flex items-center justify-between p-4 bg-surface border border-border rounded-2xl hover:border-primary/50 transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 text-primary rounded-xl group-hover:bg-primary group-hover:text-white transition-all"><MessageCircle size={18} /></div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-textPrimary">Join Chat Room</p>
                                <p className="text-[10px] text-textSecondary">Engage directly with the user</p>
                            </div>
                        </div>
                        <ExternalLink size={16} className="text-textSecondary" />
                    </button>

                    {selectedTicket.status !== 'RESOLVED' && (
                        <button 
                            onClick={() => resolveMutation.mutate(selectedTicket.id)}
                            disabled={resolveMutation.isPending}
                            className="w-full flex items-center justify-between p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl hover:bg-emerald-500/10 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500 text-white rounded-xl"><CheckCircle size={18} /></div>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-textPrimary">Mark as Resolved</p>
                                    <p className="text-[10px] text-emerald-600/70">Issue has been fully addressed</p>
                                </div>
                            </div>
                        </button>
                    )}

                    {selectedTicket.status === 'AI_TRIAGE' && (
                        <button 
                            onClick={() => escalateMutation.mutate(selectedTicket.id)}
                            className="w-full flex items-center justify-between p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl hover:bg-rose-500/10 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-rose-500 text-white rounded-xl"><AlertCircle size={18} /></div>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-textPrimary">Escalate to Agent</p>
                                    <p className="text-[10px] text-rose-600/70">Override AI and notify human agents</p>
                                </div>
                            </div>
                        </button>
                    )}
                </div>
            </div>
          </div>
        )}
      </DetailModal>
    </div>
  );
}
