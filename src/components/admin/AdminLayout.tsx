import { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MinimalSidebar } from './MinimalSidebar';
import { AdminHeader } from './AdminHeader';
import { AnimatedBackground } from './AnimatedBackground';
import { SegmentedNav } from './SegmentedNav';
import Dashboard from '@/pages/admin/AdminDashboard';
import LeadsPage from '@/pages/admin/LeadsPage';
import SettingsPage from '@/pages/admin/SettingsPage';
import LeadDetailPage from '@/pages/admin/LeadDetailPage';
import StrategyCallDetailPage from '@/pages/admin/StrategyCallDetailPage';
import SubscribersPage from "@/pages/admin/SubscribersPage";
import UsersPage from '@/pages/admin/UsersPage'; // ✅ ADD
import AdminTicketsPage from '@/pages/admin/AdminTickets'; // ✅ ADD
import AdminTicketDetail from '@/pages/admin/AdminTicketDetail'; // ✅ ADD
import AdminFeedbackPage from '@/pages/admin/AdminFeedback'; // ✅ ADD
import '@/styles/admin.css';

type Section = 'dashboard' | 'leads' | 'subscribers' | 'users' | 'tickets' | 'feedback' | 'settings'; // ✅ ADD 'feedback'

const sectionOrder: Section[] = ['dashboard', 'leads', 'subscribers', 'users', 'tickets', 'feedback', 'settings']; // ✅ include feedback

// Easing function matching WordPress tool
const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine initial section from URL
  const getInitialSection = (): Section => {
    if (location.pathname === '/admin/leads' || location.pathname.startsWith('/admin/leads/')) {
      return 'leads';
    }
    if (location.pathname.startsWith('/admin/strategy-calls/')) {
      return 'leads';
    }
    if (location.pathname.startsWith('/admin/tickets/')) { // ✅ ADD: Check detail page first
      return 'tickets';
    }
    if (location.pathname === '/admin/subscribers') { // ✅ NEW
      return 'subscribers';
    }
    if (location.pathname === '/admin/users') { // ✅ ADD
      return 'users';
    }
    if (location.pathname === '/admin/tickets') { // ✅ ADD
      return 'tickets';
    }
    if (location.pathname === '/admin/feedback') { // ✅ ADD
      return 'feedback';
    }
    if (location.pathname === '/admin/settings') {
      return 'settings';
    }
    return 'dashboard';
  };

  const [activeSection, setActiveSection] = useState<Section>(getInitialSection);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  // Sync active section with URL changes
  useEffect(() => {
    const section = getInitialSection();
    if (section !== activeSection) {
      setActiveSection(section);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Scroll animation effect - matches WordPress tool behavior
  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeIndex = sectionOrder.indexOf(activeSection);
      const scrollTo = scrollContainerRef.current.clientWidth * activeIndex;

      // On initial mount, set position immediately without animation
      if (isInitialMount.current) {
        scrollContainerRef.current.scrollLeft = scrollTo;
        isInitialMount.current = false;
        return;
      }

      // Otherwise, animate the scroll
      const start = scrollContainerRef.current.scrollLeft;
      const end = scrollTo;
      const duration = 800;
      const startTime = performance.now();

      const animateScroll = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeInOutCubic(progress);

        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollLeft = start + (end - start) * easedProgress;
        }

        if (progress < 1) {
          requestAnimationFrame(animateScroll);
        }
      };

      requestAnimationFrame(animateScroll);

      // Scroll page to top on section change
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeSection]);

  const handleSectionChange = useCallback(
    (newSection: Section) => {
      setActiveSection(newSection);

      // Update URL for bookmarking/refresh support
      if (newSection === 'dashboard') navigate('/admin');
      else if (newSection === 'leads') navigate('/admin/leads');
      else if (newSection === 'subscribers') navigate('/admin/subscribers'); // ✅ NEW
      else if (newSection === 'users') navigate('/admin/users'); // ✅ ADD
      else if (newSection === 'tickets') navigate('/admin/tickets'); // ✅ ADD
      else if (newSection === 'feedback') navigate('/admin/feedback'); // ✅ ADD
      else if (newSection === 'settings') navigate('/admin/settings');
    },
    [navigate]
  );

  // Render content for a specific section (handles detail routes)
  const renderSectionContent = useCallback((section: Section) => {
    switch (section) {
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
      case 'subscribers':
        return <SubscribersPage />;
      case 'users':
        return <UsersPage />;
      case 'tickets':
        if (location.pathname.startsWith('/admin/tickets/') && location.pathname !== '/admin/tickets') {
          return <AdminTicketDetail />;
        }
        return <AdminTicketsPage />;
      case 'feedback':
        return <AdminFeedbackPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard />;
    }
  }, [location.pathname]);

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

        {/* Main Content with horizontal scroll slide animation */}
        <main className="flex-1 overflow-hidden">
          <div
            ref={scrollContainerRef}
            className="flex overflow-x-hidden scroll-smooth h-full"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {sectionOrder.map((section) => (
              <section
                key={section}
                className="w-full flex-shrink-0 px-6 pb-6"
                style={{ scrollSnapAlign: 'start' }}
              >
                {renderSectionContent(section)}
              </section>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
