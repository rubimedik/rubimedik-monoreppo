import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import Pagination from '../components/ui/Pagination';
import { Search, Trash2, User, Clock, CheckCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export default function Referrals() {
  const [searchTerm, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data: referralsResponse, isLoading } = useQuery({
    queryKey: ['admin-referrals', page],
    queryFn: async () => {
      const res = await api.get(`/admin/referrals?page=${page}&limit=10`);
      return res.data;
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await api.post('/admin/users/bulk-delete', { ids });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-referrals'] });
      toast.success('Selected items deleted');
      setSelectedIds([]);
    },
  });

  const referrals = referralsResponse?.items || [];
  const meta = referralsResponse?.meta || { page: 1, lastPage: 1 };

  const filteredReferrals = referrals.filter((r: any) => 
    r.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.referrer?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(filteredReferrals.map((r: any) => r.id));
    else setSelectedIds([]);
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-textPrimary tracking-tight">Referral Management</h2>
            <p className="text-textSecondary">Track user invitations and conversion status.</p>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-textSecondary opacity-50 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearch(e.target.value)} className="pl-10 pr-4 py-2 bg-surface border border-border rounded-xl text-sm" />
          </div>
        </div>

        <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-background border-b border-border">
                  <th className="px-6 py-4 text-left"><input type="checkbox" onChange={handleSelectAll} checked={selectedIds.length === filteredReferrals.length && filteredReferrals.length > 0} /></th>
                  <th className="px-6 py-4 text-left text-xs font-black text-textSecondary uppercase tracking-widest">Invited User</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-textSecondary uppercase tracking-widest">Referrer</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-textSecondary uppercase tracking-widest">Joined</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-textSecondary uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-black text-textSecondary uppercase tracking-widest">Reward</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-textSecondary italic">Loading...</td></tr>
                ) : filteredReferrals.map((item: any) => (
                  <tr key={item.id} className={cn("hover:bg-background/50 transition-colors group", selectedIds.includes(item.id) && "bg-primary/5")}>
                    <td className="px-6 py-4"><input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => handleSelectOne(item.id)} /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center border border-border font-bold uppercase">{item.fullName?.[0] || item.email[0]}</div>
                        <div><p className="text-sm font-bold text-textPrimary">{item.fullName || 'No Name'}</p><p className="text-xs text-textSecondary">{item.email}</p></div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {item.referrer ? (
                        <div className="flex items-center gap-2"><User size={14} className="text-textSecondary opacity-50" /><div><p className="text-sm font-semibold">{item.referrer.fullName || 'User'}</p><p className="text-[10px]">{item.referrer.email}</p></div></div>
                      ) : <span className="text-xs italic opacity-50">Direct signup</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-textSecondary">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-black uppercase", item.status === 'COMPLETED' ? 'bg-success-bg text-success-text' : 'bg-warning-bg text-warning-text')}>
                        {item.status === 'COMPLETED' ? <CheckCircle size={10} /> : <Clock size={10} />}
                        {item.status === 'COMPLETED' ? 'Earned' : 'Pending'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-black">₦{item.status === 'COMPLETED' ? item.rewardAmount || '500.00' : '0.00'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={meta.page} lastPage={meta.lastPage} onPageChange={setPage} />
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-textPrimary text-surface px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 z-50 animate-in fade-in slide-in-from-bottom-8">
          <p className="text-sm font-bold">{selectedIds.length} items selected</p>
          <div className="h-4 w-px bg-surface/20" />
          <button onClick={() => { if(window.confirm('Delete selected invites?')) bulkDeleteMutation.mutate(selectedIds); }} disabled={bulkDeleteMutation.isPending} className="text-sm font-black text-danger-text flex items-center gap-2 hover:opacity-80 transition-all"><Trash2 size={18} />Delete Selected</button>
          <button onClick={() => setSelectedIds([])} className="text-xs font-bold text-surface/60 hover:text-surface">Cancel</button>
        </div>
      )}
    </>
  );
}
