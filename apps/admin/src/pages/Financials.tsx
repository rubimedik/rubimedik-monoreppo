import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import DetailModal from '../components/ui/DetailModal';
import Pagination from '../components/ui/Pagination';
import { Wallet, Landmark, Clock, CheckCircle, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Financials() {
  const [selectedPayout, setSelectedPayout] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [earningsPeriod, setEarningsPeriod] = useState<'today' | '7days' | '1month' | 'all'>('all');

  const { data: response, isLoading } = useQuery({
    queryKey: ['admin-payouts', page],
    queryFn: async () => {
      const res = await api.get(`/admin/financials/payouts?page=${page}&limit=10`);
      return res.data;
    },
  });

  const { data: earnings, isLoading: earningsLoading } = useQuery({
      queryKey: ['admin-earnings', earningsPeriod],
      queryFn: async () => {
          const res = await api.get(`/admin/financials/earnings?period=${earningsPeriod}`);
          return res.data;
      }
  });

  const payouts = response?.items || [];
  const meta = response?.meta || { page: 1, lastPage: 1 };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-textPrimary tracking-tight">Financial Management</h2>
          <p className="text-textSecondary text-sm">Monitor platform revenue and manage specialist payouts.</p>
        </div>

        <div className="flex items-center gap-2 bg-surface p-1 rounded-xl border border-border">
            {(['today', '7days', '1month', 'all'] as const).map((p) => (
                <button
                    key={p}
                    onClick={() => setEarningsPeriod(p)}
                    className={cn(
                        "px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                        earningsPeriod === p ? "bg-primary text-white shadow-md" : "text-textSecondary hover:text-textPrimary"
                    )}
                >
                    {p === 'all' ? 'All Time' : p === '1month' ? '1 Month' : p === '7days' ? '7 Days' : 'Today'}
                </button>
            ))}
        </div>
      </div>

      {/* Platform Earnings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface border border-border p-6 rounded-3xl relative overflow-hidden group hover:border-primary/30 transition-all">
              <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl"><TrendingUp size={24} /></div>
                  <p className="text-xs font-black text-textSecondary uppercase tracking-widest">Gross Consultation Value</p>
              </div>
              <h3 className="text-3xl font-black text-textPrimary tracking-tight">
                  {earningsLoading ? '...' : `₦${Number(earnings?.totalConsultationValue || 0).toLocaleString()}`}
              </h3>
              <p className="text-[10px] text-textSecondary mt-2 uppercase font-bold tracking-tighter">Total money handled by platform</p>
          </div>

          <div className="bg-surface border border-border p-6 rounded-3xl relative overflow-hidden group hover:border-primary/30 transition-all">
              <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-primary/10 text-primary rounded-2xl"><DollarSign size={24} /></div>
                  <p className="text-xs font-black text-textSecondary uppercase tracking-widest">Platform Earnings (Fees)</p>
              </div>
              <h3 className="text-3xl font-black text-primary tracking-tight">
                  {earningsLoading ? '...' : `₦${Number(earnings?.totalEarnings || 0).toLocaleString()}`}
              </h3>
              <p className="text-[10px] text-textSecondary mt-2 uppercase font-bold tracking-tighter">20% commission from bookings</p>
          </div>

          <div className="bg-surface border border-border p-6 rounded-3xl relative overflow-hidden group hover:border-primary/30 transition-all">
              <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl"><Calendar size={24} /></div>
                  <p className="text-xs font-black text-textSecondary uppercase tracking-widest">Total Consultations</p>
              </div>
              <h3 className="text-3xl font-black text-textPrimary tracking-tight">
                  {earningsLoading ? '...' : (earnings?.consultationCount || 0)}
              </h3>
              <p className="text-[10px] text-textSecondary mt-2 uppercase font-bold tracking-tighter">Completed sessions in period</p>
          </div>
      </div>

      <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm transition-colors duration-300">
        <div className="p-6 border-b border-border flex items-center justify-between">
            <h4 className="font-bold text-textPrimary uppercase tracking-widest text-xs">Recent Withdrawal Requests</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-background border-b border-border">
                <th className="px-6 py-4 text-left text-xs font-black text-textSecondary uppercase tracking-widest">Recipient</th>
                <th className="px-6 py-4 text-left text-xs font-black text-textSecondary uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-black text-textSecondary uppercase tracking-widest">Request Date</th>
                <th className="px-6 py-4 text-left text-xs font-black text-textSecondary uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-right text-xs font-black text-textSecondary uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-textSecondary italic">Loading payouts...</td></tr>
              ) : payouts?.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-textSecondary">No withdrawal requests found.</td></tr>
              ) : payouts.map((payout: any) => (
                <tr key={payout.id} className="hover:bg-background/50 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-textPrimary">{payout.wallet?.user?.email || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-textPrimary">₦{Number(payout.amount).toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-textSecondary font-medium">
                    {new Date(payout.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                      payout.status === 'COMPLETED' ? 'bg-success-bg text-success-text' : 'bg-warning-bg text-warning-text'
                    }`}>
                      {payout.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedPayout(payout)}
                      className="text-sm font-bold text-primary hover:text-primary-dark transition-colors"
                    >
                      View & Process
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
        isOpen={!!selectedPayout}
        onClose={() => setSelectedPayout(null)}
        title="Payout Processing"
      >
        {selectedPayout && (
          <div className="space-y-8">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center mb-2 border border-border">
                <Wallet className="w-8 h-8 text-textSecondary opacity-50" />
              </div>
              <h4 className="text-3xl font-black text-textPrimary tracking-tight">₦{Number(selectedPayout.amount).toLocaleString()}</h4>
              <p className="text-sm text-textSecondary italic">Withdrawal requested by {selectedPayout.wallet?.user?.fullName || selectedPayout.wallet?.user?.email}</p>
            </div>

            <div className="bg-background rounded-3xl p-8 space-y-6 border border-border">
              <h5 className="text-xs font-black text-textPrimary uppercase tracking-widest border-b border-border pb-3">Banking Information</h5>
              <div className="grid grid-cols-1 gap-6">
                <div className="flex items-center gap-4">
                  <Landmark className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs font-black text-textSecondary uppercase tracking-widest leading-none mb-1">Bank Name</p>
                    <p className="text-sm font-bold text-textSecondary">{selectedPayout.metadata?.bankName || 'Access Bank'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs font-black text-textSecondary uppercase tracking-widest leading-none mb-1">Account Number</p>
                    <p className="text-sm font-bold font-mono text-textSecondary">{selectedPayout.metadata?.accountNumber || '0123456789'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs font-black text-textSecondary uppercase tracking-widest leading-none mb-1">Account Name</p>
                    <p className="text-sm font-bold text-textSecondary">{selectedPayout.metadata?.accountName || 'Verified User'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button className="flex-1 py-4 bg-emerald-600 text-textPrimary font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 uppercase tracking-widest text-xs">
                Approve & Pay (Manual)
              </button>
              <button className="flex-1 py-4 bg-danger-bg text-danger-text font-black rounded-xl hover:bg-danger-bg/80 transition-all uppercase tracking-widest text-xs">
                Decline Request
              </button>
            </div>
          </div>
        )}
      </DetailModal>
    </div>
  );
}
