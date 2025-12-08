import React, { useState } from "react";
import { Calendar } from "lucide-react";
import DashboardStats from "./DashboardStats";

const goldGradient =
  "bg-gradient-to-r from-[#E1C37A] to-[#B6934C] text-[#1A1A1C]";

export default function SocialDashboard() {
  const [range, setRange] = useState("7days");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E1C37A] to-[#B6934C] flex items-center justify-center">
            <div className="w-6 h-6 rounded-lg bg-[#1A1A1C] flex flex-col gap-0.5 p-1">
              <div className="flex gap-0.5 flex-1">
                <span className="w-1/2 rounded-sm bg-[#E1C37A]" />
                <span className="w-1/2 rounded-sm bg-[#B6934C]" />
              </div>
              <div className="flex gap-0.5 flex-1">
                <span className="w-1/2 rounded-sm bg-[#B6934C]" />
                <span className="w-1/2 rounded-sm bg-[#E1C37A]" />
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold">Dashboard</h2>
            <p className="text-sm text-[#A9AAAC]">
              Track your performance across connected platforms.
            </p>
          </div>
        </div>

        {/* Date range selector (visual only) */}
        <div className="inline-flex items-center rounded-xl border border-[#3B3C3E] bg-[#18181B] px-3 py-1.5 text-sm text-[#D6D7D8] gap-2">
          <Calendar className="w-4 h-4 text-[#E1C37A]" />
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="bg-transparent outline-none border-none text-sm text-[#D6D7D8]"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Stats row */}
      <DashboardStats />

      {/* Charts + platform performance (static styling only) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Overview */}
        <div className="lg:col-span-2 rounded-2xl bg-[#1C1C20]/80 border border-white/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#D6D7D8]">
              Performance Overview
            </h3>
            <div className="flex items-center gap-2 text-[11px]">
              <button className="px-3 py-1 rounded-full bg-[#E1C37A]/15 text-[#E1C37A]">
                Impressions
              </button>
              <button className="px-3 py-1 rounded-full bg-[#23232A] text-[#A9AAAC]">
                Engagements
              </button>
              <button className="px-3 py-1 rounded-full bg-[#23232A] text-[#A9AAAC]">
                Clicks
              </button>
            </div>
          </div>
          <div className="h-56 rounded-xl border border-dashed border-[#3B3C3E] bg-[#111114]/80 flex items-center justify-center text-xs text-[#5B5C60]">
            Chart visualization coming soon
          </div>
        </div>

        {/* Platform Performance */}
        <div className="rounded-2xl bg-[#1C1C20]/80 border border-white/5 p-5">
          <h3 className="text-sm font-semibold text-[#D6D7D8] mb-4">
            Platform Performance
          </h3>

          <div className="space-y-3 text-xs">
            {[
              { name: "Facebook", value: 0 },
              { name: "Instagram", value: 0 },
              { name: "LinkedIn", value: 0 },
              { name: "TikTok", value: 0 },
            ].map((p) => (
              <div key={p.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[#D6D7D8]">{p.name}</span>
                  <span className="text-[#A9AAAC]">{p.value}</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#23232A] overflow-hidden">
                  <div className="h-full w-1/6 rounded-full bg-gradient-to-r from-[#E1C37A] to-[#B6934C]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
