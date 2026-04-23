import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import DetailModal from '../components/ui/DetailModal';
import Pagination from '../components/ui/Pagination';
import { Eye, CheckCircle, XCircle, FileText, User, Building } from 'lucide-react';

export default function KYC() {
  const [activeTab, setActiveTab] = useState<'specialists' | 'hospitals'>('specialists');
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: specialistsResponse, isLoading: specsLoading } = useQuery({
    queryKey: ['admin-kyc-specs', page],
    queryFn: async () => {
      const res = await api.get(`/admin/kyc/specialists?page=${page}&limit=10`);
      return res.data;
    },
    enabled: activeTab === 'specialists',
  });

  const { data: hospitalsResponse, isLoading: hospLoading } = useQuery({
    queryKey: ['admin-kyc-hospitals', page],
    queryFn: async () => {
      const res = await api.get(`/admin/kyc/hospitals?page=${page}&limit=10`);
      return res.data;
    },
    enabled: activeTab === 'hospitals',
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string, type: string }) => {
      return api.post(`/admin/kyc/${type}/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-kyc-specs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-kyc-hospitals'] });
      setSelectedReq(null);
    }
  });

  const response = activeTab === 'specialists' ? specialistsResponse : hospitalsResponse;
  const data = response?.items || [];
  const meta = response?.meta || { page: 1, lastPage: 1 };
  const isLoading = activeTab === 'specialists' ? specsLoading : hospLoading;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-textPrimary tracking-tight">KYC Verifications</h2>
          <p className="text-textSecondary text-sm sm:text-base">Review and approve professional documentation for specialists and hospitals.</p>
        </div>
      </div>

      <div className="flex gap-1 bg-surface border border-border p-1 rounded-2xl w-fit shadow-sm">
        <button 
          onClick={() => {
            setActiveTab('specialists');
            setPage(1);
          }}
          className={`px-6 py-2 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
            activeTab === 'specialists' ? 'bg-primary text-textPrimary shadow-lg shadow-primary/20' : 'text-textSecondary hover:bg-background'
          }`}
        >
          Specialists
        </button>
        <button 
          onClick={() => {
            setActiveTab('hospitals');
            setPage(1);
          }}
          className={`px-6 py-2 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
            activeTab === 'hospitals' ? 'bg-primary text-textPrimary shadow-lg shadow-primary/20' : 'text-textSecondary hover:bg-background'
          }`}
        >
          Hospitals
        </button>
      </div>

      <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm transition-colors duration-300">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-background border-b border-border">
                <th className="px-6 py-4 text-left text-xs font-black text-textSecondary uppercase tracking-widest">Provider</th>
                <th className="px-6 py-4 text-left text-xs font-black text-textSecondary uppercase tracking-widest">Detail</th>
                <th className="px-6 py-4 text-left text-xs font-black text-textSecondary uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-right text-xs font-black text-textSecondary uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-textSecondary italic">Loading requests...</td></tr>
              ) : !data || data.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-textSecondary">No pending {activeTab} for verification.</td></tr>
              ) : data.map((item: any) => (
                <tr key={item.id} className="hover:bg-background/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-textPrimary">{activeTab === 'specialists' ? item.user?.fullName : item.hospitalName}</p>
                    <p className="text-xs text-textSecondary italic">{item.user?.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-semibold text-textSecondary uppercase tracking-tight">{activeTab === 'specialists' ? item.specialty : item.licenseNumber}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 bg-warning-bg text-warning-text rounded-md text-[10px] font-black uppercase tracking-widest border border-orange-100">
                      Pending
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedReq(item)}
                      className="flex items-center gap-2 ml-auto text-sm font-bold text-primary hover:text-primary-dark"
                    >
                      <Eye size={16} />
                      Review Application
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination 
          currentPage={meta.page}
          lastPage={meta.lastPage}
          onPageChange={setPage}
        />
      </div>

      <DetailModal
        isOpen={!!selectedReq}
        onClose={() => setSelectedReq(null)}
        title={activeTab === 'specialists' ? "Specialist Verification" : "Hospital Verification"}
      >
        {selectedReq && (
          <div className="space-y-8">
            <div className="bg-background p-6 rounded-3xl border border-border flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-surface flex items-center justify-center border border-border shadow-sm shrink-0">
                {activeTab === 'specialists' ? <User className="text-primary" /> : <Building className="text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-lg font-bold text-textPrimary truncate">
                  {activeTab === 'specialists' ? selectedReq.user?.fullName : selectedReq.hospitalName}
                </h4>
                <p className="text-sm text-textSecondary truncate italic">{selectedReq.user?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <h5 className="text-[10px] font-black text-textPrimary uppercase tracking-widest border-b border-border pb-2">Professional Info</h5>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-black text-textSecondary uppercase tracking-tighter">License Number</p>
                    <p className="text-sm font-bold text-textSecondary">{selectedReq.licenseNumber}</p>
                  </div>
                  {activeTab === 'specialists' ? (
                    <div>
                      <p className="text-[10px] font-black text-textSecondary uppercase tracking-tighter">Specialty</p>
                      <p className="text-sm font-bold text-textSecondary">{selectedReq.specialty}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-[10px] font-black text-textSecondary uppercase tracking-tighter">Address</p>
                      <p className="text-sm font-bold text-textSecondary">{selectedReq.address}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h5 className="text-[10px] font-black text-textPrimary uppercase tracking-widest border-b border-border pb-2">Uploaded Document</h5>
                <a 
                  href={activeTab === 'specialists' ? selectedReq.certificationUrl : selectedReq.documentUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-2xl hover:border-primary/50 hover:bg-danger-bg/50 transition-all group"
                >
                  <FileText className="w-8 h-8 text-textSecondary opacity-30 group-hover:text-primary transition-colors mb-2" />
                  <span className="text-[10px] font-bold text-textSecondary opacity-70 group-hover:text-primary-dark uppercase tracking-widest">Click to View Doc</span>
                </a>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => approveMutation.mutate({ id: selectedReq.id, type: activeTab })}
                disabled={approveMutation.isPending}
                className="flex-1 py-4 bg-emerald-600 text-textPrimary font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
              >
                <CheckCircle size={18} />
                Approve {activeTab === 'specialists' ? 'Specialist' : 'Hospital'}
              </button>
              <button 
                className="flex-1 py-4 bg-danger-bg text-danger-text font-black rounded-2xl hover:bg-danger-bg/80 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
              >
                <XCircle size={18} />
                Reject
              </button>
            </div>
          </div>
        )}
      </DetailModal>
    </div>
  );
}
