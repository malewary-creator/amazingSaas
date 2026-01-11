import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { ScrollToTop } from '@/components/ui/ScrollToTop';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  ClipboardCheck, 
  Wrench, 
  FileText, 
  Receipt, 
  CreditCard, 
  Package, 
  Headphones, 
  BarChart3, 
  Settings,
  Menu,
  X,
  LogOut
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Leads', path: '/leads', icon: UserPlus },
  { name: 'Customers', path: '/customers', icon: Users },
  { name: 'Survey', path: '/survey', icon: ClipboardCheck },
  { name: 'Projects', path: '/projects', icon: Wrench },
  { name: 'Projects Kanban', path: '/projects/kanban', icon: Wrench },
  { name: 'Quotations', path: '/quotations', icon: FileText },
  { name: 'Invoices', path: '/invoices', icon: Receipt },
  { name: 'Payments', path: '/payments', icon: CreditCard },
  { name: 'Inventory', path: '/inventory', icon: Package },
  { name: 'Service', path: '/service', icon: Headphones },
  { name: 'Reports', path: '/reports', icon: BarChart3 },
  { name: 'Settings', path: '/settings', icon: Settings },
];

function DashboardLayout({ children }: DashboardLayoutProps) {
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const mainRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Detect scroll for header shadow effect
  useEffect(() => {
    const mainElement = mainRef.current;
    if (!mainElement) return;
    
    const handleScroll = () => {
      setIsScrolled(mainElement.scrollTop > 10);
    };
    
    mainElement.addEventListener('scroll', handleScroll);
    return () => mainElement.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text, #1e293b)' }}
    >
      {/* Sidebar - Fixed and Full Height */}
      <aside
        className={`fixed left-0 top-0 h-screen transition-all duration-300 z-30 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
        style={{ backgroundColor: 'var(--color-surface)', borderRight: '1px solid var(--color-border)' }}
      >
        <div
          className="h-16 flex items-center justify-between px-4"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          {!sidebarCollapsed && (
            <h1 className="text-xl font-bold text-orange-600">☀️ Shine Solar</h1>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg transition-colors"
            style={{ backgroundColor: 'transparent' }}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
        </div>
        
        {/* Scrollable Navigation */}
        <nav className="h-[calc(100vh-4rem)] overflow-y-auto p-4 space-y-1 scrollbar-thin scrollbar-track-transparent"
          style={{ backgroundColor: 'var(--color-surface)' }}
        >
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <Icon size={20} />
                {!sidebarCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>
      
      {/* Main Content - With margin for fixed sidebar */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        sidebarCollapsed ? 'ml-20' : 'ml-64'
      }`}>
        {/* Header - Sticky at top with dynamic shadow */}
        <header
          className={`sticky top-0 h-16 flex items-center justify-between px-6 z-20 transition-shadow duration-200 ${
            isScrolled ? 'shadow-md' : 'shadow-sm'
          }`}
          style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}
        >
          <h2 className="text-xl font-semibold text-gray-800">
            {menuItems.find(item => location.pathname.startsWith(item.path))?.name || 'Dashboard'}
          </h2>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>
        
        {/* Page Content - Scrollable area */}
        <main ref={mainRef} className="flex-1 overflow-y-auto scroll-smooth">
          <div className="p-6">
            {children}
          </div>
        </main>
        
        {/* Scroll to Top Button */}
        <ScrollToTop scrollContainerRef={mainRef} />
      </div>
    </div>
  );
}

export default DashboardLayout;
