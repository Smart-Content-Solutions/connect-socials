export default async function handler(req: any, res: any) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const user_id = req.query.user_id || req.body?.user_id;
        const platform = req.query.platform || req.body?.platform;

        if (!user_id) {
            return res.status(400).json({ error: 'user_id is required' });
        }

        const { createClient } = await import('@supabase/supabase-js');
        
        // Try both Supabase URLs
        const urls = [
            "https://wbhfbcqcefbnsjvqmjte.supabase.co",
            "https://bgwmonmfulmmdwlbdekz.supabase.co"
        ];
        
        const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiaGZiY3FjZWZibnNqdnFtanRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE2NTY2MiwiZXhwIjoyMDc5NzQxNjYyfQ.0AT9XjB1GHDr94wY5Tm-oIhE8uBxvRafhgAx7akNrV8";

        // Try each URL
        for (const supabaseUrl of urls) {
            try {
                const supabase = createClient(supabaseUrl, serviceKey);
                
                let query = supabase
                    .from('user_social_credentials')
                    .select('*');
                
                if (platform) {
                    query = query.eq('platform', platform);
                }
                
                query = query.eq('user_id', user_id);
                
                const { data, error, status } = await query;
                
                if (data && data.length > 0) {
                    return res.status(200).json({
                        success: true,
                        found: true,
                        url: supabaseUrl,
                        data: data,
                        count: data.length
                    });
                }
            } catch (e) {
                console.log(`Error with ${supabaseUrl}:`, e.message);
            }
        }

        return res.status(200).json({
            success: true,
            found: false,
            searched_user_id: user_id,
            searched_platform: platform,
            message: "No credentials found in any database"
        });

    } catch (error: any) {
        console.error('Error:', error);
        return res.status(500).json({
            error: error.message,
            stack: error.stack
        });
    }
}
