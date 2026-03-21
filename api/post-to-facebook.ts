export default async function handler(req: any, res: any) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { user_id, page_id, message, link, image_url } = req.body;

        if (!user_id) {
            return res.status(400).json({ success: false, error: 'user_id is required' });
        }
        if (!page_id) {
            return res.status(400).json({ success: false, error: 'page_id is required' });
        }
        if (!message) {
            return res.status(400).json({ success: false, error: 'message is required' });
        }

        const supabaseUrl = "https://wbhfbcqcefbnsjvqmjte.supabase.co";
        const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiaGZiY3FjZWZibnNqdnFtanRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE2NTY2MiwiZXhwIjoyMDc5NzQxNjYyfQ.0AT9XjB1GHDr94wY5Tm-oIhE8uBxvRafhgAx7akNrV8";

        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, serviceKey);

        const { data: credData, error: credError } = await supabase
            .from('user_social_credentials')
            .select('credentials')
            .eq('user_id', user_id)
            .eq('platform', 'facebook');

        if (credError || !credData || credData.length === 0) {
            return res.status(404).json({ success: false, error: 'Facebook not connected' });
        }

        const credentials = credData[0].credentials;
        let pageAccessToken = credentials.access_token;

        if (page_id && credentials.pages) {
            const page = credentials.pages.find((p: any) => p.id === page_id);
            if (page && page.access_token) {
                pageAccessToken = page.access_token;
            }
        }

        const fbResponse = await fetch(
            `https://graph.facebook.com/v19.0/${page_id}/feed`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    link: link || null,
                    access_token: pageAccessToken
                })
            }
        );

        const fbResult = await fbResponse.json();

        if (fbResult.error) {
            console.error('Facebook API error:', fbResult.error);
            return res.status(400).json({
                success: false,
                error: fbResult.error.message,
                error_code: fbResult.error.code
            });
        }

        return res.status(200).json({
            success: true,
            post_id: fbResult.id,
            message: 'Posted to Facebook successfully'
        });

    } catch (error: any) {
        console.error('Error posting to Facebook:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to post to Facebook'
        });
    }
}
