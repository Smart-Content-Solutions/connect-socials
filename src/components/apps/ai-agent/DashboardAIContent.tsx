import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
    LayoutDashboard,
    TrendingUp,
    Brain,
    Sparkles,
    CheckCircle,
    XCircle,
    Clock,
    FileText,
    Globe,
    BarChart3,
    Activity,
    Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { useUser } from "@clerk/clerk-react";
import { supabaseAI as supabase } from "@/lib/supabaseAIAgent";

interface AIActivity {
    id: string;
    user_id: string;
    activity_type: 'training' | 'editing';
    site_name?: string;
    site_url?: string;
    training_data?: any;
    post_id?: string;
    post_title?: string;
    post_url?: string;
    original_score?: number;
    improved_score?: number;
    improvements?: any;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    error_message?: string;
    metadata?: any;
    created_at: string;
    updated_at: string;
}

interface DashboardStats {
    totalTrainings: number;
    totalEdits: number;
    avgScoreImprovement: number;
    successRate: number;
    recentActivities: AIActivity[];
}

export default function DashboardAIContent() {
    const { user } = useUser();
    const [activities, setActivities] = useState<AIActivity[]>([]);
    const [stats, setStats] = useState<DashboardStats>({
        totalTrainings: 0,
        totalEdits: 0,
        avgScoreImprovement: 0,
        successRate: 0,
        recentActivities: []
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user?.id) {
            fetchActivities();
        }
    }, [user?.id]);

    const fetchActivities = async () => {
        if (!user?.id) return;

        setIsLoading(true);
        setError(null);

        try {
            console.log("Fetching activities for user:", user.id);
            // Fetch all activities for the user
            const { data, error: fetchError } = await supabase
                .from('ai_agent_activities')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (fetchError) {
                console.error("Supabase Error:", fetchError);
                throw fetchError;
            }

            console.log("Activities found:", data?.length || 0);
            const activitiesData = data as AIActivity[] || [];
            setActivities(activitiesData);

            // Calculate statistics
            const trainings = activitiesData.filter(a => a.activity_type === 'training');
            const edits = activitiesData.filter(a => a.activity_type === 'editing');
            const completed = activitiesData.filter(a => a.status === 'completed');

            // Calculate average score improvement
            const scoreImprovements = edits
                .filter(e => e.original_score !== undefined && e.improved_score !== undefined)
                .map(e => (e.improved_score || 0) - (e.original_score || 0));

            const avgImprovement = scoreImprovements.length > 0
                ? scoreImprovements.reduce((a, b) => a + b, 0) / scoreImprovements.length
                : 0;

            const successRate = activitiesData.length > 0
                ? (completed.length / activitiesData.length) * 100
                : 0;

            setStats({
                totalTrainings: trainings.length,
                totalEdits: edits.length,
                avgScoreImprovement: Math.round(avgImprovement),
                successRate: Math.round(successRate),
                recentActivities: activitiesData.slice(0, 10)
            });

        } catch (err: any) {
            console.error('Error fetching AI activities:', err);
            setError(err.message || 'Failed to load activity data');
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'failed':
                return <XCircle className="w-4 h-4 text-red-500" />;
            case 'processing':
                return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
            default:
                return <Clock className="w-4 h-4 text-yellow-500" />;
        }
    };

    const getActivityIcon = (type: string) => {
        return type === 'training'
            ? <Brain className="w-5 h-5 text-purple-500" />
            : <Sparkles className="w-5 h-5 text-blue-500" />;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const statCards = [
        {
            label: "AI Training Sessions",
            value: stats.totalTrainings.toString(),
            change: "Total",
            icon: Brain,
            color: "text-purple-500"
        },
        {
            label: "Posts Enhanced",
            value: stats.totalEdits.toString(),
            change: "Total",
            icon: Sparkles,
            color: "text-blue-500"
        },
        {
            label: "Avg SEO Improvement",
            value: stats.avgScoreImprovement > 0 ? `+${stats.avgScoreImprovement}` : stats.avgScoreImprovement.toString(),
            change: "Points",
            icon: TrendingUp,
            color: "text-green-500"
        },
        {
            label: "Success Rate",
            value: `${stats.successRate}%`,
            change: "Completed",
            icon: BarChart3,
            color: "text-emerald-500"
        },
    ];

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
                <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
                <p className="text-sm text-[#A9AAAC]">Loading activity data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                    <h4 className="text-[#D6D7D8] font-semibold text-sm">Error Loading Data</h4>
                    <p className="text-[#A9AAAC] text-xs mt-1">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="text-[#D6D7D8]">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <LayoutDashboard className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-[#D6D7D8]">AI Agent Dashboard</h2>
                    <p className="text-[#A9AAAC] text-sm">
                        Track your AI training and content enhancement activities
                    </p>
                </div>
            </div>

            {/* Info Banner */}
            <div className="mb-6 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-start gap-3">
                <Activity className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                <div>
                    <h4 className="text-[#D6D7D8] font-semibold text-sm">Activity Monitoring</h4>
                    <p className="text-[#A9AAAC] text-xs mt-1">
                        All AI training sessions and post enhancements are tracked here for monitoring and reassurance.
                        View detailed history of what the AI has been doing.
                    </p>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {statCards.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className="bg-[#3B3C3E]/30 backdrop-blur-sm border-white/5 hover:border-purple-500/20 transition-all">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <stat.icon className={`w-8 h-8 ${stat.color}`} />
                                    <span className="text-sm font-semibold text-[#A9AAAC]">{stat.change}</span>
                                </div>
                                <div className="text-3xl font-bold text-[#D6D7D8] mb-1">{stat.value}</div>
                                <div className="text-sm text-[#A9AAAC]">{stat.label}</div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Recent Activity */}
            <Card className="bg-[#3B3C3E]/30 backdrop-blur-sm border-white/5">
                <CardHeader className="border-b border-white/5 p-4 flex flex-row items-center justify-between">
                    <h3 className="text-lg font-bold text-[#D6D7D8]">Recent Activity</h3>
                    <span className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        Last 50 actions
                    </span>
                </CardHeader>
                <CardContent className="p-4">
                    <div className="space-y-3">
                        {stats.recentActivities.length === 0 ? (
                            <div className="text-center py-12 text-[#5B5C60]">
                                <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p className="text-sm italic">No AI activities yet</p>
                                <p className="text-xs mt-1">Train your AI or enhance posts to see activity here</p>
                            </div>
                        ) : (
                            stats.recentActivities.map((activity, index) => (
                                <motion.div
                                    key={activity.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="flex items-start gap-4 p-4 rounded-lg bg-[#2C2C2E] border border-white/5 hover:border-purple-500/20 transition-all group"
                                >
                                    {/* Activity Icon */}
                                    <div className="w-10 h-10 rounded-lg bg-[#1A1A1C] flex items-center justify-center shrink-0 border border-white/5 group-hover:border-purple-500/30">
                                        {getActivityIcon(activity.activity_type)}
                                    </div>

                                    {/* Activity Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-sm text-[#E1C37A] capitalize">
                                                {activity.activity_type === 'training' ? 'AI Training' : 'Post Enhancement'}
                                            </span>
                                            <span className="text-xs text-[#5B5C60]">•</span>
                                            <span className="text-xs text-[#5B5C60]">{formatDate(activity.created_at)}</span>
                                            {getStatusIcon(activity.status)}
                                        </div>

                                        {/* Training Details */}
                                        {activity.activity_type === 'training' && (
                                            <div className="space-y-1">
                                                <p className="text-[#D6D7D8] text-sm font-medium flex items-center gap-2">
                                                    <Globe className="w-3 h-3" />
                                                    {activity.site_name || 'Unknown Site'}
                                                </p>
                                                {activity.site_url && (
                                                    <p className="text-[#A9AAAC] text-xs truncate">{activity.site_url}</p>
                                                )}
                                            </div>
                                        )}

                                        {/* Editing Details */}
                                        {activity.activity_type === 'editing' && (
                                            <div className="space-y-1">
                                                <p className="text-[#D6D7D8] text-sm font-medium flex items-center gap-2">
                                                    <FileText className="w-3 h-3" />
                                                    {activity.post_title || 'Post Enhancement'}
                                                </p>
                                                {activity.original_score !== undefined && activity.improved_score !== undefined && (
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <span className="text-[#A9AAAC]">SEO Score:</span>
                                                        <span className="text-red-400">{activity.original_score}</span>
                                                        <span className="text-[#5B5C60]">→</span>
                                                        <span className="text-green-400">{activity.improved_score}</span>
                                                        <span className="text-green-400 font-semibold">
                                                            (+{activity.improved_score - activity.original_score})
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Error Message */}
                                        {activity.status === 'failed' && activity.error_message && (
                                            <p className="text-red-400 text-xs mt-1 italic">{activity.error_message}</p>
                                        )}

                                        {/* Status Badge */}
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className={`text-xs px-2 py-0.5 rounded uppercase tracking-wide ${activity.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                                activity.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                                                    activity.status === 'processing' ? 'bg-blue-500/20 text-blue-400' :
                                                        'bg-yellow-500/20 text-yellow-400'
                                                }`}>
                                                {activity.status}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
