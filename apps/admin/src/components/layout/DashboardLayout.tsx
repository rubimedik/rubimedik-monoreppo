import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Stethoscope, 
  Heart, 
  Wallet, 
  ShieldCheck, Share2, 
  LogOut,
  Bell,
  Moon,
  Sun,
  Menu,
  X,
  HelpCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar when navigating on mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/login');
  };

  const navItems = [
    { name: 'Overview', href: '/', icon: LayoutDashboard },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Consultations', href: '/consultations', icon: Stethoscope },
    { name: 'Donations', href: '/donations', icon: Heart },
    { name: 'Financials', href: '/financials', icon: Wallet },
    { name: 'KYC Verification', href: '/kyc', icon: ShieldCheck },
    { name: 'Referrals', href: '/referrals', icon: Share2 },
    { name: 'Support Tickets', href: '/support', icon: HelpCircle },
  ];

  return (
    <div className="flex h-screen bg-background font-sans transition-colors duration-300 relative overflow-hidden">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-border flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-white font-bold text-lg">R</span>
            </div>
            <span className="text-xl font-bold text-textPrimary tracking-tight">RubiMedik</span>
          </Link>
          <button 
            className="lg:hidden p-2 text-textSecondary hover:bg-background rounded-lg"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                  isActive 
                    ? "bg-primary text-white shadow-lg shadow-primary/20" 
                    : "text-textSecondary hover:bg-background hover:text-textPrimary"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-white" : "text-textSecondary opacity-50 group-hover:opacity-100 group-hover:text-textPrimary")} />
                <span className="font-medium text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full px-4 py-3 text-textSecondary hover:bg-background rounded-xl transition-colors group"
          >
            {theme === 'light' ? (
              <>
                <Moon className="w-5 h-5 text-textSecondary opacity-50 group-hover:opacity-100" />
                <span className="font-medium text-sm">Dark Mode</span>
              </>
            ) : (
              <>
                <Sun className="w-5 h-5 text-textSecondary opacity-50 group-hover:text-yellow-500 group-hover:opacity-100" />
                <span className="font-medium text-sm">Light Mode</span>
              </>
            )}
          </button>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-textSecondary hover:bg-danger-bg/50 hover:text-danger-text rounded-xl transition-colors group"
          >
            <LogOut className="w-5 h-5 text-textSecondary opacity-50 group-hover:text-danger-text group-hover:opacity-100" />
            <span className="font-medium text-sm">Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-surface border-b border-border px-4 lg:px-8 flex items-center justify-between transition-colors duration-300">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 text-textSecondary hover:bg-background rounded-lg transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-semibold text-textPrimary uppercase tracking-wide text-[10px] sm:text-xs opacity-50 truncate">
              Platform Management
            </h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <button className="p-2 text-textSecondary opacity-50 hover:bg-background hover:opacity-100 rounded-full transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-surface"></span>
            </button>
            <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-border">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-textPrimary leading-none">Admin Panel</p>
                <p className="text-xs text-textSecondary mt-1 uppercase font-medium tracking-tighter">Verified Manager</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-background border border-border flex items-center justify-center">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-textSecondary opacity-50" />
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
