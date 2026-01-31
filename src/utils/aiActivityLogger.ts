import { supabase } from "@/lib/supabase";

export interface TrainingActivityData {
    site_name: string;
    site_url: string;
    training_data?: any;
}

export interface EditingActivityData {
    post_id: string;
    post_title: string;
    post_url?: string;
    original_score?: number;
    improved_score?: number;
    improvements?: any;
}

export type ActivityType = 'training' | 'editing';
export type ActivityStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Log an AI Agent activity to the database
 */
export async function logAIActivity(
    userId: string,
    activityType: ActivityType,
    data: TrainingActivityData | EditingActivityData,
    status: ActivityStatus = 'pending',
    metadata?: any
) {
    try {
        const activityData: any = {
            user_id: userId,
            activity_type: activityType,
            status,
            metadata
        };

        // Add type-specific fields
        if (activityType === 'training') {
            const trainingData = data as TrainingActivityData;
            activityData.site_name = trainingData.site_name;
            activityData.site_url = trainingData.site_url;
            activityData.training_data = trainingData.training_data;
        } else if (activityType === 'editing') {
            const editingData = data as EditingActivityData;
            activityData.post_id = editingData.post_id;
            activityData.post_title = editingData.post_title;
            activityData.post_url = editingData.post_url;
            activityData.original_score = editingData.original_score;
            activityData.improved_score = editingData.improved_score;
            activityData.improvements = editingData.improvements;
        }

        const { data: result, error } = await supabase
            .from('ai_agent_activities')
            .insert(activityData)
            .select()
            .single();

        if (error) {
            console.error('Error logging AI activity:', error);
            throw error;
        }

        return result;
    } catch (error) {
        console.error('Failed to log AI activity:', error);
        throw error;
    }
}

/**
 * Update an existing AI activity status
 */
export async function updateAIActivityStatus(
    activityId: string,
    status: ActivityStatus,
    errorMessage?: string,
    additionalData?: any
) {
    try {
        const updateData: any = {
            status,
            updated_at: new Date().toISOString()
        };

        if (errorMessage) {
            updateData.error_message = errorMessage;
        }

        if (additionalData) {
            // Merge additional data into metadata
            updateData.metadata = additionalData;
        }

        const { data, error } = await supabase
            .from('ai_agent_activities')
            .update(updateData)
            .eq('id', activityId)
            .select()
            .single();

        if (error) {
            console.error('Error updating AI activity:', error);
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Failed to update AI activity:', error);
        throw error;
    }
}

/**
 * Get recent AI activities for a user
 */
export async function getRecentAIActivities(userId: string, limit: number = 10) {
    try {
        const { data, error } = await supabase
            .from('ai_agent_activities')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching AI activities:', error);
            throw error;
        }

        return data || [];
    } catch (error) {
        console.error('Failed to fetch AI activities:', error);
        throw error;
    }
}

/**
 * Get AI activity statistics for a user
 */
export async function getAIActivityStats(userId: string) {
    try {
        const { data, error } = await supabase
            .from('ai_agent_activities')
            .select('*')
            .eq('user_id', userId);

        if (error) {
            console.error('Error fetching AI activity stats:', error);
            throw error;
        }

        const activities = data || [];
        const trainings = activities.filter(a => a.activity_type === 'training');
        const edits = activities.filter(a => a.activity_type === 'editing');
        const completed = activities.filter(a => a.status === 'completed');

        // Calculate average score improvement
        const scoreImprovements = edits
            .filter(e => e.original_score !== undefined && e.improved_score !== undefined)
            .map(e => (e.improved_score || 0) - (e.original_score || 0));

        const avgImprovement = scoreImprovements.length > 0
            ? scoreImprovements.reduce((a, b) => a + b, 0) / scoreImprovements.length
            : 0;

        const successRate = activities.length > 0
            ? (completed.length / activities.length) * 100
            : 0;

        return {
            totalTrainings: trainings.length,
            totalEdits: edits.length,
            avgScoreImprovement: Math.round(avgImprovement),
            successRate: Math.round(successRate),
            totalActivities: activities.length,
            completedActivities: completed.length
        };
    } catch (error) {
        console.error('Failed to fetch AI activity stats:', error);
        throw error;
    }
}
