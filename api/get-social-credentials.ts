export default async function handler(req: any, res: any) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        let user_id;
        let platform;

        if (req.method === 'GET') {
            user_id = req.query.user_id;
            platform = req.query.platform;
        } else {
            user_id = req.body?.user_id;
            platform = req.body?.platform;
        }

        if (!user_id) {
            return res.status(400).json({ success: false, error: 'user_id is required' });
        }

        const supabaseUrl = process.env.SUPABASE_SCS_URL || "https://bgwmonmfulmmdwlbdekz.supabase.co";
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseServiceKey) {
            return res.status(500).json({ success: false, error: 'Server configuration error' });
        }

        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        if (platform) {
            const { data, error } = await supabase
                .from('user_social_credentials')
                .select('*')
                .eq('user_id', user_id)
                .eq('platform', platform)
                .single();

            if (error || !data) {
                return res.status(200).json({
                    success: true,
                    connected: false,
                    platform
                });
            }

            return res.status(200).json({
                success: true,
                connected: true,
                platform,
                credentials: data.credentials,
                updated_at: data.updated_at
            });
        } else {
            const { data, error } = await supabase
                .from('user_social_credentials')
                .select('platform, updated_at')
                .eq('user_id', user_id);

            if (error) {
                return res.status(200).json({
                    success: true,
                    connected: false,
                    platforms: []
                });
            }

            const platforms = data.map(d => ({
                platform: d.platform,
                connected: true,
                updated_at: d.updated_at
            }));

            return res.status(200).json({
                success: true,
                platforms
            });
        }

    } catch (error: any) {
        console.error('Error getting credentials:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to get credentials'
        });
    }
}
