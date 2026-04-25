import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import DetailModal from '../components/ui/DetailModal';
import Pagination from '../components/ui/Pagination';
import { User as Mail, Search, CheckCircle, XCircle, Trash2, FileText, ShieldCheck, Building, Stethoscope } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export default function Users() {
  const [searchTerm, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: usersResponse, isLoading } = useQuery({
    queryKey: ['admin-users', page, activeTab],
    queryFn: async () => {
      const roleParam = activeTab === 'ALL' ? '' : `&role=${activeTab}`;
      const res = await api.get(`/admin/users?page=${page}&limit=10${roleParam}`);
      return res.data;
    },
  });

  const toggleVerificationMutation = useMutation({
    mutationFn: async ({ userId, isVerified }: { userId: string; isVerified: boolean }) => {
      const res = await api.post(`/admin/users/${userId}/verification`, { isVerified });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User verification status updated');
    },
  });

  const approveKYCMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string, type: 'specialists' | 'hospitals' }) => {
      return api.post(`/admin/kyc/${type}/${id}/approve`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(`${variables.type === 'specialists' ? 'Specialist' : 'Hospital'} approved successfully`);
      if (selectedUser) {
          const profileKey = variables.type === 'specialists' ? 'specialistProfile' : 'hospitalProfile';
          setSelectedUser({
              ...selectedUser,
              [profileKey]: { ...selectedUser[profileKey], isApproved: true }
          });
      }
    }
  });

  const rejectKYCMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string, type: 'specialists' | 'hospitals' }) => {
      return api.post(`/admin/kyc/${type}/${id}/reject`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(`${variables.type === 'specialists' ? 'Specialist' : 'Hospital'} verification rejected`);
      if (selectedUser) {
          const profileKey = variables.type === 'specialists' ? 'specialistProfile' : 'hospitalProfile';
          setSelectedUser({
              ...selectedUser,
              [profileKey]: { ...selectedUser[profileKey], isApproved: false }
          });
      }
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await api.post('/admin/users/bulk-delete', { ids });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Selected users deleted successfully');
      setSelectedIds([]);
      navigate('/users', { replace: true });
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.delete(`/admin/users/${userId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User deleted successfully');
      setSelectedUser(null);
      navigate('/users', { replace: true });
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const users = usersResponse?.items || [];
  const meta = usersResponse?.meta || { page: 1, lastPage: 1 };

  const filteredUsers = users.filter((u: any) => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(filteredUsers.map((u: any) => u.id));
    else setSelectedIds([]);
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} users?`)) {
      bulkDeleteMutation.mutate(selectedIds);
    }
  };

  return (
    <>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-textPrimary tracking-tight">User Management</h2>
            <p className="text-textSecondary">Manage all registered accounts on the platform.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-textSecondary opacity-50 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearch(e.target.value)} className="pl-10 pr-4 py-2 bg-surface border border-border rounded-xl text-sm" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {['ALL', 'SPECIALIST', 'HOSPITAL', 'PATIENT', 'DONOR'].map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); setPage(1); }} className={cn("px-4 py-2 rounded-xl text-xs font-black uppercase", activeTab === tab ? "bg-primary text-white" : "bg-surface text-textSecondary border border-border")}>{tab}</button>
          ))}
        </div>

        <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-background border-b border-border">
                  <th className="px-6 py-4 text-left"><input type="checkbox" onChange={handleSelectAll} checked={selectedIds.length === filteredUsers.length && filteredUsers.length > 0} /></th>
                  <th className="px-6 py-4 text-left text-xs font-black text-textSecondary uppercase tracking-widest">User</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-textSecondary uppercase tracking-widest">Roles</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-textSecondary uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-black text-textSecondary uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-textSecondary italic">Loading...</td></tr>
                ) : filteredUsers.map((user: any) => (
                  <tr key={user.id} className={cn("hover:bg-background/50 transition-colors group", selectedIds.includes(user.id) && "bg-primary/5")}>
                    <td className="px-6 py-4"><input type="checkbox" checked={selectedIds.includes(user.id)} onChange={() => handleSelectOne(user.id)} /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center border border-border font-bold uppercase">{user.fullName?.[0] || user.email[0]}</div>
                        <div><p className="text-sm font-bold text-textPrimary">{user.fullName || 'No Name'}</p><p className="text-xs text-textSecondary">{user.email}</p></div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="flex flex-wrap gap-1">{user.roles.map((role: string) => <span key={role} className="px-2 py-0.5 bg-background text-textSecondary rounded-md text-[10px] font-black uppercase">{role}</span>)}</div></td>
                    <td className="px-6 py-4"><span className={cn("px-2 py-1 rounded-lg text-[10px] font-black uppercase", user.isVerified ? 'bg-success-bg text-success-text' : 'bg-warning-bg text-warning-text')}>{user.isVerified ? 'Verified' : 'Pending'}</span></td>
                    <td className="px-6 py-4 text-right"><button onClick={() => setSelectedUser(user)} className="text-sm font-bold text-primary">View Details</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={meta.page} lastPage={meta.lastPage} onPageChange={setPage} />
        </div>

        <DetailModal isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} title="User Profile Details">
          {selectedUser && (
            <div className="space-y-8">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-3xl bg-background border border-border flex items-center justify-center text-3xl font-black uppercase">{selectedUser.fullName?.[0] || selectedUser.email[0]}</div>
                <div><h4 className="text-2xl font-bold">{selectedUser.fullName || 'N/A'}</h4><p className="text-textSecondary flex items-center gap-2 mt-1 italic"><Mail size={14} />{selectedUser.email}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1"><p className="text-[10px] font-black text-textSecondary uppercase tracking-widest">Account Status</p><p className="text-sm font-semibold">{selectedUser.isVerified ? 'Email Verified' : 'Unverified'}</p></div>
                <div className="space-y-1"><p className="text-[10px] font-black text-textSecondary uppercase tracking-widest">Referral Code</p><p className="text-sm font-semibold text-primary font-mono">{selectedUser.referralCode || 'NONE'}</p></div>
              </div>

              {/* Specialist KYC Section */}
              {selectedUser.roles.includes('SPECIALIST') && selectedUser.specialistProfile && (
                  <div className="bg-background p-6 rounded-3xl border border-border space-y-4">
                      <div className="flex items-center justify-between border-b border-border pb-4">
                          <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/10 rounded-xl text-primary"><Stethoscope size={18} /></div>
                              <h5 className="font-bold text-textPrimary">Specialist Professional Info</h5>
                          </div>
                          <span className={cn("px-2 py-1 rounded-lg text-[10px] font-black uppercase", selectedUser.specialistProfile.isApproved ? 'bg-success-bg text-success-text' : 'bg-warning-bg text-warning-text')}>
                              {selectedUser.specialistProfile.isApproved ? 'KYC Approved' : 'KYC Pending'}
                          </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                              <p className="text-[10px] font-black text-textSecondary uppercase tracking-tighter">License Number</p>
                              <p className="text-sm font-bold text-textPrimary">{selectedUser.specialistProfile.licenseNumber}</p>
                          </div>
                          <div className="space-y-1">
                              <p className="text-[10px] font-black text-textSecondary uppercase tracking-tighter">Specialty</p>
                              <p className="text-sm font-bold text-textPrimary">{selectedUser.specialistProfile.specialty}</p>
                          </div>
                      </div>
                      <div className="space-y-2">
                          <p className="text-[10px] font-black text-textSecondary uppercase tracking-tighter">Uploaded Certification</p>
                          <a 
                            href={selectedUser.specialistProfile.certificationUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center gap-3 p-4 bg-surface border border-border rounded-2xl hover:border-primary/50 transition-all group"
                          >
                            <FileText className="text-textSecondary opacity-50 group-hover:text-primary" size={20} />
                            <span className="text-xs font-bold text-textSecondary group-hover:text-primary truncate">View Certification Document</span>
                          </a>
                      </div>
                      <div className="flex gap-2 pt-2">
                        {selectedUser.specialistProfile.isApproved ? (
                            <button onClick={() => rejectKYCMutation.mutate({ id: selectedUser.specialistProfile.id, type: 'specialists' })} className="flex-1 py-2 bg-danger-bg text-danger-text text-[10px] font-black uppercase rounded-lg">Revoke Approval</button>
                        ) : (
                            <button onClick={() => approveKYCMutation.mutate({ id: selectedUser.specialistProfile.id, type: 'specialists' })} className="flex-1 py-2 bg-success-bg text-success-text text-[10px] font-black uppercase rounded-lg">Approve specialist</button>
                        )}
                      </div>
                  </div>
              )}

              {/* Hospital KYC Section */}
              {selectedUser.roles.includes('HOSPITAL') && selectedUser.hospitalProfile && (
                  <div className="bg-background p-6 rounded-3xl border border-border space-y-4">
                      <div className="flex items-center justify-between border-b border-border pb-4">
                          <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/10 rounded-xl text-primary"><Building size={18} /></div>
                              <h5 className="font-bold text-textPrimary">Hospital Professional Info</h5>
                          </div>
                          <span className={cn("px-2 py-1 rounded-lg text-[10px] font-black uppercase", selectedUser.hospitalProfile.isApproved ? 'bg-success-bg text-success-text' : 'bg-warning-bg text-warning-text')}>
                              {selectedUser.hospitalProfile.isApproved ? 'KYC Approved' : 'KYC Pending'}
                          </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                              <p className="text-[10px] font-black text-textSecondary uppercase tracking-tighter">Hospital Name</p>
                              <p className="text-sm font-bold text-textPrimary">{selectedUser.hospitalProfile.hospitalName}</p>
                          </div>
                          <div className="space-y-1">
                              <p className="text-[10px] font-black text-textSecondary uppercase tracking-tighter">License Number</p>
                              <p className="text-sm font-bold text-textPrimary">{selectedUser.hospitalProfile.licenseNumber}</p>
                          </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 p-4 bg-surface rounded-2xl border border-border">
                          <div className="space-y-1">
                              <p className="text-[10px] font-black text-textSecondary uppercase tracking-tighter">Units Received</p>
                              <p className="text-lg font-black text-primary">{selectedUser.hospitalProfile.unitsReceived || 0}</p>
                          </div>
                          <div className="space-y-1">
                              <p className="text-[10px] font-black text-textSecondary uppercase tracking-tighter">Platform Reserve (40%)</p>
                              <p className="text-lg font-black text-indigo-600">{selectedUser.hospitalProfile.reservedUnits || 0}</p>
                          </div>
                      </div>

                      <div className="space-y-2">
                          <p className="text-[10px] font-black text-textSecondary uppercase tracking-tighter">Registration Documents</p>
                          <a 
                            href={selectedUser.hospitalProfile.documentUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center gap-3 p-4 bg-surface border border-border rounded-2xl hover:border-primary/50 transition-all group"
                          >
                            <FileText className="text-textSecondary opacity-50 group-hover:text-primary" size={20} />
                            <span className="text-xs font-bold text-textSecondary group-hover:text-primary truncate">View Registration Document</span>
                          </a>
                      </div>
                      <div className="flex gap-2 pt-2">
                        {selectedUser.hospitalProfile.isApproved ? (
                            <button onClick={() => rejectKYCMutation.mutate({ id: selectedUser.hospitalProfile.id, type: 'hospitals' })} className="flex-1 py-2 bg-danger-bg text-danger-text text-[10px] font-black uppercase rounded-lg">Revoke Approval</button>
                        ) : (
                            <button onClick={() => approveKYCMutation.mutate({ id: selectedUser.hospitalProfile.id, type: 'hospitals' })} className="flex-1 py-2 bg-success-bg text-success-text text-[10px] font-black uppercase rounded-lg">Approve hospital</button>
                        )}
                      </div>
                  </div>
              )}

              <div className="pt-6 border-t border-border flex flex-wrap gap-3">
                {selectedUser.isVerified ? (
                  <button onClick={() => toggleVerificationMutation.mutate({ userId: selectedUser.id, isVerified: false })} className="flex-1 py-3 bg-warning-bg text-warning-text font-bold rounded-xl flex items-center justify-center gap-2"><XCircle size={18} />Revoke</button>
                ) : (
                  <button onClick={() => toggleVerificationMutation.mutate({ userId: selectedUser.id, isVerified: true })} className="flex-1 py-3 bg-success-bg text-success-text font-bold rounded-xl flex items-center justify-center gap-2"><CheckCircle size={18} />Verify</button>
                )}
                <button onClick={() => { if(window.confirm('Delete this user?')) deleteUserMutation.mutate(selectedUser.id); }} className="flex-1 py-3 border-2 border-danger-text/20 text-danger-text font-bold rounded-xl flex items-center justify-center gap-2"><Trash2 size={18} />Delete</button>
              </div>
            </div>
          )}
        </DetailModal>
      </div>

      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-textPrimary text-surface px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 z-50 animate-in fade-in slide-in-from-bottom-8">
          <p className="text-sm font-bold">{selectedIds.length} users selected</p>
          <div className="h-4 w-px bg-surface/20" />
          <button onClick={handleBulkDelete} disabled={bulkDeleteMutation.isPending} className="text-sm font-black text-danger-text flex items-center gap-2 hover:opacity-80 transition-all"><Trash2 size={18} />Delete Selected</button>
          <button onClick={() => setSelectedIds([])} className="text-xs font-bold text-surface/60 hover:text-surface">Cancel</button>
        </div>
      )}
    </>
  );
}
