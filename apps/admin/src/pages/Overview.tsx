import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { 
  Users, 
  Stethoscope, 
  Heart, 
  TrendingUp,
  Activity,
  Clock,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Overview() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await api.get('/admin/stats');
      return res.data;
    },
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['admin-activities'],
    queryFn: async () => {
      const res = await api.get('/admin/recent-activities');
      return res.data;
    },
  });

  const statCards = [
    { name: 'Specialists', value: stats?.totalSpecialists || 0, icon: Stethoscope, color: 'text-info-text', bg: 'bg-info-bg' },
    { name: 'Hospitals', value: stats?.totalHospitals || 0, icon: ShieldCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
    { name: 'Patients', value: stats?.totalPatients || 0, icon: Users, color: 'text-info-text', bg: 'bg-info-bg' },
    { name: 'Donors', value: stats?.totalDonors || 0, icon: Heart, color: 'text-success-text', bg: 'bg-success-bg' },
    { name: 'Donations', value: stats?.totalDonations || 0, icon: Heart, color: 'text-danger-text', bg: 'bg-danger-bg' },
    { name: 'Revenue', value: `₦${(stats?.totalRevenue || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-primary', bg: 'bg-danger-bg' },
  ];

  if (statsLoading) {
    return <div className="p-8 text-center text-textSecondary">Loading dashboard data...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-textPrimary tracking-tight">Dashboard Overview</h2>
          <p className="text-textSecondary text-sm sm:text-base">Welcome back to the Rubimedik administration panel.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-xl shadow-sm w-fit">
          <Clock className="w-4 h-4 text-textSecondary opacity-50" />
          <span className="text-sm font-medium text-textSecondary">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.name} className="card p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className={cn("p-3 rounded-2xl", card.bg)}>
                  <Icon className={cn("w-6 h-6", card.color)} />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-textSecondary uppercase tracking-wider">{card.name}</p>
                <h3 className="text-2xl font-bold text-textPrimary mt-1">{card.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activities Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-textPrimary flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Recent System Activities
            </h3>
            <button className="text-sm font-semibold text-primary hover:opacity-80 transition-colors">View All Activities</button>
          </div>

          <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm">
            {activitiesLoading ? (
              <div className="p-8 text-center text-textSecondary italic">Fetching updates...</div>
            ) : activities?.length === 0 ? (
              <div className="p-8 text-center text-textSecondary">No recent activities found.</div>
            ) : (
              <div className="divide-y divide-border">
                {activities.map((activity: any, idx: number) => (
                  <div key={idx} className="p-5 flex items-center gap-4 hover:bg-background/50 transition-colors group cursor-pointer">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                      activity.type === 'user_signup' ? 'bg-info-bg text-info-text' :
                      activity.type === 'consultation_booked' ? 'bg-info-bg text-info-text' :
                      'bg-success-bg text-success-text'
                    )}>
                      {activity.type === 'user_signup' ? <Users size={20} /> :
                       activity.type === 'consultation_booked' ? <Stethoscope size={20} /> :
                       <Heart size={20} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-textPrimary group-hover:text-primary transition-colors truncate">
                        {activity.type === 'user_signup' ? `New user joined: ${activity.data.email}` :
                         activity.type === 'consultation_booked' ? `Consultation booked by ${activity.data.patient?.fullName || 'Patient'}` :
                         `Donation matched for ${activity.data.request?.bloodType} blood`}
                      </p>
                      <p className="text-xs text-textSecondary mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(activity.date).toLocaleString()}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-textSecondary opacity-30 group-hover:text-primary transition-colors" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* System Health / Quick Stats */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-textPrimary flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-success-text" />
            System Health
          </h3>
          <div className="card p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-2 h-2 rounded-full animate-pulse",
                  stats?.redisStatus === 'Operational' ? 'bg-success' : 'bg-danger'
                )}></div>
                <span className="text-sm font-medium text-textSecondary">Redis Cache</span>
              </div>
              <span className={cn(
                "text-xs font-bold uppercase",
                stats?.redisStatus === 'Operational' ? 'text-success-text' : 'text-danger-text'
              )}>{stats?.redisStatus || 'Checking...'}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span className="text-sm font-medium text-textSecondary">Database</span>
              </div>
              <span className="text-xs font-bold text-success-text uppercase">Connected</span>
            </div>
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-textSecondary opacity-70 mb-4 uppercase tracking-widest font-bold">Donation Overview</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-textSecondary italic">Total Requests</span>
                  <span className="bg-info-bg text-info-text text-[10px] font-black px-2 py-0.5 rounded-full">{stats?.totalRequests || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-textSecondary italic">Pending Requests</span>
                  <span className="bg-danger-bg text-danger-text text-[10px] font-black px-2 py-0.5 rounded-full">{stats?.pendingRequests || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
