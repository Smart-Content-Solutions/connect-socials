import { useState, useCallback, useMemo, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MinimalSidebar } from './MinimalSidebar';
import { AdminHeader } from './AdminHeader';
import { AnimatedBackground } from './AnimatedBackground';
import { SegmentedNav } from './SegmentedNav';
import Dashboard from '@/pages/admin/AdminDashboard';
import LeadsPage from '@/pages/admin/LeadsPage';
import SettingsPage from '@/pages/admin/SettingsPage';
import LeadDetailPage from '@/pages/admin/LeadDetailPage';
import StrategyCallDetailPage from '@/pages/admin/StrategyCallDetailPage';
import SubscribersPage from '@/pages/admin/subscriberspage'; // ✅ NEW
import UsersPage from '@/pages/admin/UsersPage'; // ✅ ADD
import '@/styles/admin.css';

type Section = 'dashboard' | 'leads' | 'subscribers' | 'users' | 'settings'; // ✅ ADD 'users'

const sectionOrder: Section[] = ['dashboard', 'leads', 'subscribers', 'users', 'settings']; // ✅ include users

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
};

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Determine initial section from URL
  const getInitialSection = (): Section => {
    if (location.pathname === '/admin/leads' || location.pathname.startsWith('/admin/leads/')) {
      return 'leads';
    }
    if (location.pathname.startsWith('/admin/strategy-calls/')) {
      return 'leads';
    }
    if (location.pathname === '/admin/subscribers') { // ✅ NEW
      return 'subscribers';
    }
    if (location.pathname === '/admin/users') { // ✅ ADD
      return 'users';
    }
    if (location.pathname === '/admin/settings') {
      return 'settings';
    }
    return 'dashboard';
  };

  const [activeSection, setActiveSection] = useState<Section>(getInitialSection);
  const [direction, setDirection] = useState(0);

  // Sync active section with URL changes
  useEffect(() => {
    const section = getInitialSection();
    if (section !== activeSection) {
      setActiveSection(section);
    }
  }, [location.pathname]);

  const handleSectionChange = useCallback(
    (newSection: Section) => {
      const currentIndex = sectionOrder.indexOf(activeSection);
      const newIndex = sectionOrder.indexOf(newSection);
      setDirection(newIndex > currentIndex ? 1 : -1);
      setActiveSection(newSection);

      // Update URL for bookmarking/refresh support
      if (newSection === 'dashboard') navigate('/admin');
      else if (newSection === 'leads') navigate('/admin/leads');
      else if (newSection === 'subscribers') navigate('/admin/subscribers'); // ✅ NEW
      else if (newSection === 'users') navigate('/admin/users'); // ✅ ADD
      else if (newSection === 'settings') navigate('/admin/settings');
    },
    [activeSection, navigate]
  );

  const renderSection = useMemo(() => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'leads':
        if (location.pathname.startsWith('/admin/leads/')) {
          return <LeadDetailPage />;
        }
        if (location.pathname.startsWith('/admin/strategy-calls/')) {
          return <StrategyCallDetailPage />;
        }
        return <LeadsPage />;
      case 'subscribers': // ✅ NEW
        return <SubscribersPage />;
      case 'users': // ✅ ADD
        return <UsersPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard />;
    }
  }, [activeSection, location.pathname]);

  return (
    <div className="admin-theme min-h-screen bg-background">
      {/* Animated ambient background */}
      <AnimatedBackground />

      {/* Minimal sidebar with just logo */}
      <MinimalSidebar />

      <div className="ml-16 min-h-screen flex flex-col relative z-10">
        <AdminHeader />

        {/* Segmented Navigation */}
        <SegmentedNav
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
        />

        {/* Main Content with horizontal slide animation */}
        <main className="flex-1 px-6 pb-6 overflow-hidden">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={activeSection}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'tween', duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
                opacity: { duration: 0.25 },
              }}
              className="will-change-transform"
            >
              {renderSection}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
