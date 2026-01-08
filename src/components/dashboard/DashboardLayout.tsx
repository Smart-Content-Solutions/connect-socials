import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Share2,
  Mail,
  BarChart3,
  Phone,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  CalendarCheck,
} from "lucide-react";

function fakeLogout() {
  window.location.href = "/";
}

export default function DashboardLayout({ children, user }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Daily Tracker", path: "/planner/daily-tracker", icon: CalendarCheck },
    { name: "Social Posts", path: "/social-posts", icon: Share2 },
    { name: "Email Campaigns", path: "/email-campaigns", icon: Mail },
    { name: "Analytics", path: "/analytics", icon: BarChart3 },
    { name: "Leads & Calls", path: "/leads-calls", icon: Phone },
    { name: "Account Settings", path: "/account-settings", icon: Settings },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_68b073eda37c031e7cfdae1c/ffd16f891_logo.jpg"
              alt="Smart Content Solutions"
              className="h-10 w-10 object-contain"
            />
            <span className="font-bold gradient-text">SCS Dashboard</span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {sidebarOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r shadow-lg transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_68b073eda37c031e7cfdae1c/ffd16f891_logo.jpg"
                className="h-12 w-12 object-contain"
              />
              <div>
                <span className="font-bold gradient-text block">
                  Smart Content
                </span>
                <span className="text-xs text-gray-500">Dashboard</span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-3">
              <div className="text-sm font-semibold text-gray-900">
                {user?.full_name}
              </div>
              <div className="text-xs text-gray-600">{user?.email}</div>
              <div className="mt-2">
                <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                  {user?.subscription_plan}
                </span>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive(item.path)
                  ? "bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-md"
                  : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t space-y-2">
            <Link
              to="/home"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">Back to Website</span>
            </Link>

            <Button
              onClick={fakeLogout}
              variant="outline"
              className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      <main className="lg:ml-64 pt-16 lg:pt-0">
        <div className="p-6">{children}</div>
      </main>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
