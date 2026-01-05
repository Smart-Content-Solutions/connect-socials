import React, { useState, useEffect, ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Sparkles, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SoundProvider,
  SoundToggle,
  useSounds
} from "../../components/shared/SoundEffects";
import {
  SubscriptionProvider,
  useSubscription
} from "../../components/subscription/useSubscription";

function LayoutContent({ children }: { children: ReactNode }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu and scroll to top on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [location.pathname]);

  const { isAuthenticated, login } = useSubscription();

  const navLinks = [
    { name: "Dashboard", href: "/dashboard-preview" },
    { name: "Core Tools", href: "/core-tools" },
    { name: "Corporate", href: "/corporate-tools" },
    { name: "Pricing", href: "/pricing" },
    { name: "Blogs", href: "/blog" },
    { name: "Contact", href: "/contact" }
  ];

  return (
    <div className="min-h-screen bg-[#1A1A1C] text-[#D6D7D8] overflow-x-hidden">
      {/* ================= NAVIGATION ================= */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? "nav-glass py-3" : "bg-transparent py-5"
          }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692b490db467b6aad2cac54d/360f43b39_Edittheuploadedlo.png"
              alt="SCS Logo"
              className="h-10 w-10 object-contain rounded-lg"
            />
            <span className="text-lg font-semibold tracking-tight hidden sm:block">
              Smart Content Solutions
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="text-sm text-[#A9AAAC] hover:text-[#E1C37A] transition-colors duration-300"
              >
                {link.name}
              </Link>
            ))}

            {isAuthenticated ? (
              <SoundLink
                to="/account"
                className="btn-gold px-6 py-2.5 rounded-full text-sm flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Account
              </SoundLink>
            ) : (
              <button
                onClick={() => login()}
                className="btn-gold px-6 py-2.5 rounded-full text-sm flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden nav-glass border-t border-[#3B3C3E]"
            >
              <div className="px-6 py-6 space-y-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="block text-[#A9AAAC] hover:text-[#E1C37A] transition-colors py-2"
                  >
                    {link.name}
                  </Link>
                ))}

                {isAuthenticated ? (
                  <SoundLink
                    to="/account"
                    className="btn-gold px-6 py-3 rounded-full text-sm flex items-center justify-center gap-2 mt-4"
                  >
                    <User className="w-4 h-4" />
                    My Account
                  </SoundLink>
                ) : (
                  <button
                    onClick={() => login()}
                    className="btn-gold px-6 py-3 rounded-full text-sm flex items-center justify-center gap-2 mt-4 w-full"
                  >
                    <Sparkles className="w-4 h-4" />
                    Sign In
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ================= PAGE TRANSITION ================= */}
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{
            duration: 0.3,
            ease: [0.25, 0.1, 0.25, 1]
          }}
        >
          {children}
        </motion.main>
      </AnimatePresence>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-[#3B3C3E] bg-[#1A1A1C]">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="md:col-span-2">
              <Link to="/" className="flex items-center gap-3 mb-6">
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_68b073eda37c031e7cfdae1c/1ac06212f_download.jpg"
                  alt="SCS Logo"
                  className="h-12 w-12 object-contain rounded-lg"
                />
                <span className="text-xl font-semibold">
                  Smart Content Solutions
                </span>
              </Link>
              <p className="text-[#A9AAAC] text-sm leading-relaxed max-w-md">
                AI automation that runs while you sleep. Scale your content.
                Crush your competition. The future of marketing is here.
              </p>
            </div>

            <div>
              <h4 className="text-[#E1C37A] font-semibold mb-4">Platform</h4>
              <div className="space-y-3">
                <Link to="/dashboard" className="block text-sm text-[#A9AAAC] hover:text-white">
                  Dashboard
                </Link>
                <Link to="/core-tools" className="block text-sm text-[#A9AAAC] hover:text-white">
                  Core Tools
                </Link>
                <Link to="/corporate-tools" className="block text-sm text-[#A9AAAC] hover:text-white">
                  Corporate Tools
                </Link>
                <Link to="/pricing" className="block text-sm text-[#A9AAAC] hover:text-white">
                  Pricing
                </Link>
              </div>
            </div>

            <div>
              <h4 className="text-[#E1C37A] font-semibold mb-4">Company</h4>
              <div className="space-y-3">
                <Link to="/contact" className="block text-sm text-[#A9AAAC] hover:text-white">
                  Contact
                </Link>
                <Link to="/contact" className="block text-sm text-[#A9AAAC] hover:text-white">
                  Book a Call
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-[#3B3C3E] mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-[#5B5C60]">
              © {new Date().getFullYear()} Smart Content Solutions. All rights
              reserved.
            </p>
            <div className="flex gap-6 items-center">
              <SoundToggle />
              <Link to="/privacy" className="text-sm text-[#5B5C60] hover:text-[#A9AAAC]">
                Privacy
              </Link>
              <Link to="/terms" className="text-sm text-[#5B5C60] hover:text-[#A9AAAC]">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ================= SOUND-ENABLED LINK ================= */
function SoundLink({
  to,
  children,
  className,
  ...props
}: {
  to: string;
  children: ReactNode;
  className?: string;
}) {
  const { playHover, playClick } = useSounds();

  return (
    <Link
      to={to}
      className={className}
      onMouseEnter={playHover}
      onClick={playClick}
      {...props}
    >
      {children}
    </Link>
  );
}

/* ================= ROOT LAYOUT ================= */
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <SoundProvider>
      <SubscriptionProvider>
        <LayoutContent>{children}</LayoutContent>
      </SubscriptionProvider>
    </SoundProvider>
  );
}
