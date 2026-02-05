import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Loader2, Phone, Users, TrendingUp } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

export default function LeadsTool() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeads() {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error) setLeads(data || []);
      setLoading(false);
    }

    loadLeads();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  /* =======================
     KPI + CHART PROCESSING
  ======================= */

  const totalLeads = leads.length;

  const avgScore =
    leads.reduce((sum, l) => sum + (l.lead_score || 0), 0) /
    (leads.length || 1);

  const intentData = ["high", "medium", "low"].map((lvl) => ({
    name: lvl,
    value: leads.filter((l) => l.intent === lvl).length
  }));

  const trendData = leads
    .slice(0, 10)
    .reverse()
    .map((l) => ({
      date: new Date(l.created_at).toLocaleDateString(),
      score: l.lead_score || 0
    }));

  /* =======================
     UI
  ======================= */

  return (
    <DashboardLayout title="Leads & Calls">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">

          <h1 className="text-3xl font-bold mb-2">Leads & Calls Manager</h1>
          <p className="text-gray-600 mb-8">
            Real-time lead capture + AI scoring overview
          </p>

          {/* KPI CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

            <Card className="shadow-lg rounded-2xl">
              <CardContent className="p-6 flex items-center gap-4">
                <Users className="w-10 h-10" />
                <div>
                  <p className="text-sm text-gray-600">Total Leads</p>
                  <h2 className="text-2xl font-bold">{totalLeads}</h2>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg rounded-2xl">
              <CardContent className="p-6 flex items-center gap-4">
                <TrendingUp className="w-10 h-10" />
                <div>
                  <p className="text-sm text-gray-600">Average Lead Score</p>
                  <h2 className="text-2xl font-bold">
                    {avgScore.toFixed(1)}
                  </h2>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg rounded-2xl">
              <CardContent className="p-6 flex items-center gap-4">
                <Phone className="w-10 h-10" />
                <div>
                  <p className="text-sm text-gray-600">Hot Leads</p>
                  <h2 className="text-2xl font-bold">
                    {leads.filter((l) => l.lead_score >= 75).length}
                  </h2>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* CHARTS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">

            <Card className="p-6 shadow-xl rounded-2xl">
              <h3 className="font-bold mb-4">Lead Score Trend</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trendData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6 shadow-xl rounded-2xl">
              <h3 className="font-bold mb-4">Intent Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={intentData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label
                  >
                    {intentData.map((_, i) => (
                      <Cell key={i} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

          </div>

          {/* TABLE */}
          <Card className="p-6 shadow-xl">
            <CardContent>

              {leads.length === 0 ? (
                <div className="text-center py-10">
                  <Phone className="w-16 h-16 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">No Leads Yet</h3>
                  <p>Your contact form is ready — start getting leads!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-3 border">Name</th>
                        <th className="p-3 border">Email</th>
                        <th className="p-3 border">Company</th>
                        <th className="p-3 border">Score</th>
                        <th className="p-3 border">Intent</th>
                        <th className="p-3 border">Date</th>
                      </tr>
                    </thead>

                    <tbody>
                      {leads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-gray-50">
                          <td className="p-3 border">{lead.name}</td>
                          <td className="p-3 border">{lead.email}</td>
                          <td className="p-3 border">{lead.company}</td>
                          <td className="p-3 border font-bold">
                            {lead.lead_score ?? "—"}
                          </td>
                          <td className="p-3 border">
                            {lead.intent ?? "—"}
                          </td>
                          <td className="p-3 border">
                            {new Date(lead.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </CardContent>
          </Card>

        </div>
      </div>
    </DashboardLayout>
  );
}
