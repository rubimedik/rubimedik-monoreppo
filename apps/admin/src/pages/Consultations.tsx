import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import DetailModal from '../components/ui/DetailModal';
import Pagination from '../components/ui/Pagination';
import { Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export default function Consultations() {
  const [selectedConsultation, setSelectedConsultation] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data: response, isLoading } = useQuery({
    queryKey: ['admin-consultations', page],
    queryFn: async () => {
      const res = await api.get(`/admin/consultations?page=${page}&limit=10`);
      return res.data;
    },
  });

  const { data: fullDetails } = useQuery({
    queryKey: ['consultation-detail', selectedConsultation?.id],
    queryFn: async () => {
        const res = await api.get(`/admin/consultations/${selectedConsultation.id}`);
        return res.data;
    },
    enabled: !!selectedConsultation?.id
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, note }: { id: string, status: string, note?: string }) => {
        const res = await api.post(`/admin/consultations/${id}/status`, { status, note });
        return res.data;
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin-consultations'] });
        toast.success('Status updated successfully');
    }
  });

  const approvePayoutMutation = useMutation({
    mutationFn: async (id: string) => {
        const res = await api.post(`/admin/consultations/${id}/approve-payout`);
        return res.data;
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin-consultations'] });
        toast.success('Payout approved and executed');
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await api.post('/admin/consultations/bulk-delete', { ids });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-consultations'] });
      toast.success('Selected consultations deleted');
      setSelectedIds([]);
    },
  });

  const consultations = response?.items || [];
  const meta = response?.meta || { page: 1, lastPage: 1 };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(consultations.map((c: any) => c.id));
    else setSelectedIds([]);
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h2 className="text-2xl font-bold text-textPrimary tracking-tight">Consultations</h2>
          <p className="text-textSecondary">Overview of all specialist consultations on the platform.</p>
        </div>

        <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-background border-b border-border">
                  <th className="px-6 py-4 text-left">
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll}
                      checked={selectedIds.length === consultations.length && consultations.length > 0}
                      className="rounded border-border text-primary focus:ring-primary/20"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-textSecondary uppercase tracking-widest">Specialist</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-textSecondary uppercase tracking-widest">Patient</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-textSecondary uppercase tracking-widest">Fee</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-textSecondary uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-black text-textSecondary uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-textSecondary italic">Loading...</td></tr>
                ) : consultations.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-textSecondary">No consultations found.</td></tr>
                ) : consultations.map((cons: any) => (
                  <tr key={cons.id} className={cn("hover:bg-background/50 transition-colors group", selectedIds.includes(cons.id) && "bg-primary/5")}>
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(cons.id)}
                        onChange={() => handleSelectOne(cons.id)}
                        className="rounded border-border text-primary focus:ring-primary/20"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-textPrimary">{cons.specialist?.fullName || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-textSecondary">{cons.patient?.fullName || cons.patient?.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-primary">₦{Number(cons.totalFee).toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-lg text-[10px] font-black uppercase",
                        cons.status === 'COMPLETED' ? 'bg-success-bg text-success-text' : 
                        cons.status === 'PENDING_PAYOUT' ? 'bg-warning-bg text-warning-text' :
                        cons.status === 'CANCELLED' ? 'bg-danger-bg text-danger-text' : 'bg-info-bg text-info-text'
                      )}>
                        {cons.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => setSelectedConsultation(cons)} className="text-sm font-bold text-primary hover:text-primary-dark">View Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={meta.page} lastPage={meta.lastPage} onPageChange={setPage} />
        </div>

        <DetailModal isOpen={!!selectedConsultation} onClose={() => setSelectedConsultation(null)} title="Consultation Management">
          {selectedConsultation && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="bg-background p-6 rounded-3xl space-y-4 border border-border shadow-inner">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-textSecondary uppercase tracking-widest">Transaction State</span>
                  <span className="px-3 py-1.5 bg-primary text-textPrimary rounded-xl text-[10px] font-black uppercase tracking-widest">{selectedConsultation.status}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border/10">
                   <div className="space-y-1">
                        <p className="text-[10px] font-black text-textSecondary uppercase tracking-widest">Payout Schedule</p>
                        <p className="text-sm font-bold text-textPrimary">{selectedConsultation.payoutReleasesAt ? new Date(selectedConsultation.payoutReleasesAt).toLocaleString() : 'Not set'}</p>
                   </div>
                   <div className="text-right">
                        <p className="text-[10px] font-black text-textSecondary uppercase tracking-widest">Amount to Specialist</p>
                        <p className="text-lg font-black text-success-text">₦{Number(selectedConsultation.specialistPayout).toLocaleString()}</p>
                   </div>
                </div>
              </div>

              {/* Feedback Comparison */}
              <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-background rounded-2xl border border-border space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-info-text animate-pulse"></div>
                          <h5 className="text-[10px] font-black text-textPrimary uppercase tracking-widest">Patient Review</h5>
                      </div>
                      {fullDetails?.patientFeedback ? (
                          <div className="space-y-3">
                              <div className="flex gap-1">
                                  {[1,2,3,4,5].map(s => <span key={s} className={cn("text-xs", s <= fullDetails.patientFeedback.rating ? "text-amber-500" : "text-border")}>★</span>)}
                              </div>
                              <p className="text-sm text-textSecondary italic leading-relaxed">"{fullDetails.patientFeedback.comment || 'No comment provided'}"</p>
                              <div className="grid grid-cols-1 gap-2 pt-2 border-t border-border/10">
                                  <p className="text-[10px] text-textSecondary">Checked In: <span className={cn("font-bold", fullDetails.isPatientCheckedIn ? "text-success-text" : "text-danger-text")}>{fullDetails.isPatientCheckedIn ? 'YES' : 'NO'}</span></p>
                                  <p className="text-[10px] text-textSecondary">Diagnosis Recieved: <span className="font-bold text-textPrimary">{fullDetails.patientFeedback.receiveDiagnosis}</span></p>
                              </div>
                          </div>
                      ) : (
                          <p className="text-xs text-textSecondary italic opacity-50">Awaiting patient feedback...</p>
                      )}
                  </div>

                  <div className="p-5 bg-background rounded-2xl border border-border space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                          <h5 className="text-[10px] font-black text-textPrimary uppercase tracking-widest">Consultant Report</h5>
                      </div>
                      {fullDetails?.specialistFeedback ? (
                          <div className="space-y-3">
                              <p className="text-sm font-bold text-textPrimary uppercase tracking-tight">{fullDetails.specialistFeedback.outcome}</p>
                              <p className="text-xs text-textSecondary leading-relaxed">{fullDetails.specialistFeedback.notes}</p>
                              <div className="grid grid-cols-1 gap-2 pt-2 border-t border-border/10">
                                  <p className="text-[10px] text-textSecondary">Checked In: <span className={cn("font-bold", fullDetails.isSpecialistCheckedIn ? "text-success-text" : "text-danger-text")}>{fullDetails.isSpecialistCheckedIn ? 'YES' : 'NO'}</span></p>
                                  <p className="text-[10px] text-textSecondary">Follow-up: <span className="font-bold text-textPrimary">{fullDetails.specialistFeedback.followUp}</span></p>
                              </div>
                          </div>
                      ) : (
                          <p className="text-xs text-textSecondary italic opacity-50">Awaiting specialist report...</p>
                      )}
                  </div>
              </div>

              {/* Admin Actions */}
              <div className="pt-6 border-t border-border flex flex-wrap gap-3">
                  <button 
                    onClick={() => { if(window.confirm('Manually release funds to specialist?')) approvePayoutMutation.mutate(selectedConsultation.id); }}
                    disabled={approvePayoutMutation.isPending}
                    className="flex-1 px-4 py-3 bg-success-bg text-success-text text-xs font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-all border border-success-text/20 disabled:opacity-50"
                  >
                    Release Payout
                  </button>
                  <button 
                    onClick={() => { const s = window.prompt('Enter new status (COMPLETED, DISPUTED, CANCELLED, UPCOMING):'); if(s) updateStatusMutation.mutate({ id: selectedConsultation.id, status: s }); }}
                    className="flex-1 px-4 py-3 bg-background text-textSecondary text-xs font-black uppercase tracking-widest rounded-xl border border-border hover:bg-surface transition-all"
                  >
                    Override Status
                  </button>
              </div>
            </div>
          )}
        </DetailModal>
      </div>

      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-textPrimary text-surface px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 z-50 animate-in fade-in slide-in-from-bottom-8">
          <p className="text-sm font-bold">{selectedIds.length} consultations selected</p>
          <div className="h-4 w-px bg-surface/20" />
          <button 
            onClick={() => { if(window.confirm('Delete selected consultations?')) bulkDeleteMutation.mutate(selectedIds); }}
            disabled={bulkDeleteMutation.isPending}
            className="text-sm font-black text-danger-text flex items-center gap-2 hover:opacity-80 transition-all"
          >
            <Trash2 size={18} />
            Delete Selected
          </button>
          <button onClick={() => setSelectedIds([])} className="text-xs font-bold text-surface/60 hover:text-surface">Cancel</button>
        </div>
      )}
    </>
  );
}
