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

        const { createClient } = await import('@supabase/supabase-js');
        
        const supabaseUrl = "https://wbhfbcqcefbnsjvqmjte.supabase.co";
        const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiaGZiY3FjZWZibnNqdnFtanRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE2NTY2MiwiZXhwIjoyMDc5NzQxNjYyfQ.0AT9XjB1GHDr94wY5Tm-oIhE8uBxvRafhgAx7akNrV8";

        const supabase = createClient(supabaseUrl, serviceKey);

        if (platform) {
            const { data, error } = await supabase
                .from('user_social_credentials')
                .select('*')
                .eq('user_id', user_id)
                .eq('platform', platform);

            if (error) {
                return res.status(200).json({
                    success: true,
                    connected: false,
                    platform,
                    error: error.message
                });
            }

            if (!data || data.length === 0) {
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
                credentials: data[0].credentials,
                updated_at: data[0].updated_at
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
                    platforms: [],
                    error: error.message
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
            error: error.message
        });
    }
}
