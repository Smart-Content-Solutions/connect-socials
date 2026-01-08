import { Routes, Route, Navigate } from "react-router-dom";
import { DataProvider } from "./store/DataProvider";
import { Layout } from "./layout/Layout";
import { DashboardView } from "./views/DashboardView";
import { DocsView } from "./views/DocsView";
import { TasksView } from "./views/TasksView";
import { SettingsView } from "./views/SettingsView";
import DailyTracker from "@/components/daily_tracker/pages/DailyTracker";
import "./planner.css";

export default function PlannerApp() {
    return (
        <div className="planner-theme min-h-screen bg-background text-foreground">
            <DataProvider>
                <Layout>
                    <Routes>
                        <Route path="/" element={<DashboardView />} />
                        <Route path="/docs" element={<DocsView />} />
                        <Route path="/tasks" element={<TasksView />} />
                        <Route path="/settings" element={<SettingsView />} />
                        <Route path="/daily-tracker" element={<DailyTracker />} />
                        <Route path="*" element={<Navigate to="/planner" replace />} />
                    </Routes>
                </Layout>
            </DataProvider>
        </div>
    );
}
