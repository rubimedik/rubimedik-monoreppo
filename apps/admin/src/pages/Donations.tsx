import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import DetailModal from '../components/ui/DetailModal';
import Pagination from '../components/ui/Pagination';
import { Heart, Trash2, Droplets, CheckCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export default function Donations() {
  const [activeTab, setActiveTab] = useState<'REQUESTS' | 'ACTUAL'>('REQUESTS');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data: requestsResponse, isLoading: requestsLoading } = useQuery({
    queryKey: ['admin-donations', page],
    queryFn: async () => {
      const res = await api.get(`/admin/donations?page=${page}&limit=10`);
      return res.data;
    },
    enabled: activeTab === 'REQUESTS',
  });

  const { data: actualResponse, isLoading: actualLoading } = useQuery({
    queryKey: ['admin-donation-matches', page],
    queryFn: async () => {
      const res = await api.get(`/admin/donation-matches?page=${page}&limit=10`);
      return res.data;
    },
    enabled: activeTab === 'ACTUAL',
  });

  const bulkDeleteRequestsMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const endpoint = activeTab === 'REQUESTS' ? '/admin/donations/bulk-delete' : '/admin/consultations/bulk-delete';
      const res = await api.post(endpoint, { ids });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [activeTab === 'REQUESTS' ? 'admin-donations' : 'admin-donation-matches'] });
      toast.success('Selected items deleted');
      setSelectedIds([]);
    },
  });

  const response = activeTab === 'REQUESTS' ? requestsResponse : actualResponse;
  const items = response?.items || [];
  const meta = response?.meta || { page: 1, lastPage: 1 };
  const isLoading = activeTab === 'REQUESTS' ? requestsLoading : actualLoading;

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(items.map((i: any) => i.id));
    else setSelectedIds([]);
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-textPrimary tracking-tight">Donations Management</h2>
            <p className="text-textSecondary">Monitor blood requests and actual donations across the platform.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-surface border border-border p-1 rounded-2xl w-fit shadow-sm">
          {['REQUESTS', 'ACTUAL'].map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab as any); setPage(1); }} className={cn("px-6 py-2 rounded-xl text-xs font-black uppercase transition-all", activeTab === tab ? "bg-primary text-textPrimary" : "text-textSecondary hover:bg-background")}>
              {tab === 'REQUESTS' ? 'Donation Requests' : 'Actual Donations'}
            </button>
          ))}
        </div>

        <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-background border-b border-border">
                  <th className="px-6 py-4 text-left"><input type="checkbox" onChange={handleSelectAll} checked={selectedIds.length === items.length && items.length > 0} /></th>
                  {activeTab === 'REQUESTS' ? (
                    <>
                      <th className="px-6 py-4 text-left text-xs font-black text-textSecondary uppercase tracking-widest">Hospital</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-textSecondary uppercase tracking-widest">Blood Type</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-textSecondary uppercase tracking-widest">Urgency</th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-4 text-left text-xs font-black text-textSecondary uppercase tracking-widest">Donor</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-textSecondary uppercase tracking-widest">Blood Type</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-textSecondary uppercase tracking-widest">Hospital</th>
                    </>
                  )}
                  <th className="px-6 py-4 text-left text-xs font-black text-textSecondary uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-black text-textSecondary uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-textSecondary italic">Loading...</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-textSecondary">No records found.</td></tr>
                ) : items.map((item: any) => (
                  <tr key={item.id} className={cn("hover:bg-background/50 transition-colors group", selectedIds.includes(item.id) && "bg-primary/5")}>
                    <td className="px-6 py-4"><input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => handleSelectOne(item.id)} /></td>
                    {activeTab === 'REQUESTS' ? (
                      <>
                        <td className="px-6 py-4"><p className="text-sm font-bold">{item.hospital?.hospitalProfile?.hospitalName || 'Hospital'}</p></td>
                        <td className="px-6 py-4"><div className="flex items-center gap-2"><Droplets className="w-4 h-4 text-red-500" /><span className="text-sm font-black">{item.bloodType}</span></div></td>
                        <td className="px-6 py-4"><span className={cn("px-2 py-0.5 rounded text-[10px] font-black uppercase", item.urgency === 'URGENT' ? 'bg-danger-bg text-danger-text' : 'bg-info-bg text-info-text')}>{item.urgency}</span></td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4"><p className="text-sm font-bold">{item.donor?.fullName || item.donor?.email || 'Unknown Donor'}</p></td>
                        <td className="px-6 py-4"><div className="flex items-center gap-2"><Droplets className="w-4 h-4 text-red-500" /><span className="text-sm font-black">{item.request?.bloodType || item.bloodType || 'N/A'}</span></div></td>
                        <td className="px-6 py-4"><p className="text-sm text-textSecondary">{item.request?.hospital?.hospitalProfile?.hospitalName || item.hospital?.hospitalName || 'N/A'}</p></td>
                      </>
                    )}
                    <td className="px-6 py-4"><span className="px-2 py-1 bg-background rounded-lg text-[10px] font-black uppercase">{item.status}</span></td>
                    <td className="px-6 py-4 text-right"><button onClick={() => setSelectedItem(item)} className="text-sm font-bold text-primary">View Details</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={meta.page} lastPage={meta.lastPage} onPageChange={setPage} />
        </div>

        <DetailModal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} title={activeTab === 'REQUESTS' ? "Request Details" : "Donation Details"}>
          {selectedItem && (
            <div className="space-y-6">
              {activeTab === 'REQUESTS' ? (
                <div className="flex items-center gap-4 p-6 bg-danger-bg rounded-2xl border border-danger-text/20">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-textPrimary"><Heart size={24} fill="currentColor" /></div>
                  <div><h4 className="text-lg font-bold">Blood Type: {selectedItem.bloodType}</h4><p className="text-sm text-danger-text font-semibold uppercase">{selectedItem.urgency} REQUEST</p></div>
                </div>
              ) : (
                <div className="flex items-center gap-4 p-6 bg-success-bg rounded-2xl border border-success-text/20">
                  <div className="w-12 h-12 rounded-full bg-success flex items-center justify-center text-white"><CheckCircle size={24} fill="currentColor" /></div>
                  <div><h4 className="text-lg font-bold">Donation: {selectedItem.request?.bloodType || selectedItem.bloodType || 'N/A'}</h4><p className="text-sm text-success-text font-semibold uppercase">STATUS: {selectedItem.status}</p></div>
                </div>
              )}
            </div>
          )}
        </DetailModal>
      </div>

      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-textPrimary text-surface px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 z-50 animate-in fade-in slide-in-from-bottom-8">
          <p className="text-sm font-bold">{selectedIds.length} items selected</p>
          <div className="h-4 w-px bg-surface/20" />
          <button onClick={() => { if(window.confirm('Delete selected items?')) bulkDeleteRequestsMutation.mutate(selectedIds); }} disabled={bulkDeleteRequestsMutation.isPending} className="text-sm font-black text-danger-text flex items-center gap-2 hover:opacity-80 transition-all"><Trash2 size={18} />Delete Selected</button>
          <button onClick={() => setSelectedIds([])} className="text-xs font-bold text-surface/60 hover:text-surface">Cancel</button>
        </div>
      )}
    </>
  );
}
