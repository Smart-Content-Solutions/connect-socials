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
        const { user_id, instagram_account_id, image_url, caption } = req.body;

        if (!user_id) {
            return res.status(400).json({ success: false, error: 'user_id is required' });
        }
        if (!instagram_account_id) {
            return res.status(400).json({ success: false, error: 'instagram_account_id is required' });
        }
        if (!caption) {
            return res.status(400).json({ success: false, error: 'caption is required' });
        }
        if (!image_url) {
            return res.status(400).json({ success: false, error: 'image_url is required' });
        }

        const supabaseUrl = "https://wbhfbcqcefbnsjvqmjte.supabase.co";
        const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiaGZiY3FjZWZibnNqdnFtanRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE2NTY2MiwiZXhwIjoyMDc5NzQxNjYyfQ.0AT9XjB1GHDr94wY5Tm-oIhE8uBxvRafhgAx7akNrV8";

        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, serviceKey);

        const { data: credData, error: credError } = await supabase
            .from('user_social_credentials')
            .select('credentials')
            .eq('user_id', user_id)
            .eq('platform', 'instagram');

        if (credError || !credData || credData.length === 0) {
            return res.status(404).json({ success: false, error: 'Instagram not connected' });
        }

        const credentials = credData[0].credentials;
        const accessToken = credentials.access_token;

        const containerResponse = await fetch(
            `https://graph.facebook.com/v19.0/${instagram_account_id}/media`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image_url,
                    caption,
                    access_token: accessToken
                })
            }
        );

        const containerResult = await containerResponse.json();

        if (containerResult.error) {
            console.error('Instagram media creation error:', containerResult.error);
            return res.status(400).json({
                success: false,
                error: containerResult.error.message
            });
        }

        const publishResponse = await fetch(
            `https://graph.facebook.com/v19.0/${instagram_account_id}/media_publish`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    creation_id: containerResult.id,
                    access_token: accessToken
                })
            }
        );

        const publishResult = await publishResponse.json();

        if (publishResult.error) {
            console.error('Instagram publish error:', publishResult.error);
            return res.status(400).json({
                success: false,
                error: publishResult.error.message
            });
        }

        return res.status(200).json({
            success: true,
            media_id: containerResult.id,
            message: 'Posted to Instagram successfully'
        });

    } catch (error: any) {
        console.error('Error posting to Instagram:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to post to Instagram'
        });
    }
}
