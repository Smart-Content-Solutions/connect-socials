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
        const { user_id, video_url, title, description } = req.body;

        if (!user_id) {
            return res.status(400).json({ success: false, error: 'user_id is required' });
        }
        if (!title) {
            return res.status(400).json({ success: false, error: 'title is required' });
        }

        const supabaseUrl = "https://wbhfbcqcefbnsjvqmjte.supabase.co";
        const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiaGZiY3FjZWZibnNqdnFtanRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE2NTY2MiwiZXhwIjoyMDc5NzQxNjYyfQ.0AT9XjB1GHDr94wY5Tm-oIhE8uBxvRafhgAx7akNrV8";

        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, serviceKey);

        const { data: credData, error: credError } = await supabase
            .from('user_social_credentials')
            .select('credentials')
            .eq('user_id', user_id)
            .eq('platform', 'tiktok');

        if (credError || !credData || credData.length === 0) {
            return res.status(404).json({ success: false, error: 'TikTok not connected' });
        }

        const credentials = credData[0].credentials;
        const accessToken = credentials.access_token;
        const openId = credentials.open_id;

        const TIKTOK_API_BASE = 'https://open.tiktokapis.com/v2';

        const initUploadResponse = await fetch(
            `${TIKTOK_API_BASE}/post/video/upload/init/`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    description: description || title
                })
            }
        );

        const initData = await initUploadResponse.json();

        if (initData.error) {
            console.error('TikTok upload init error:', initData);
            return res.status(400).json({
                success: false,
                error: initData.error.message || 'Failed to initialize TikTok upload'
            });
        }

        const uploadUrl = initData.upload_url;
        const videoId = initData.video_id;

        if (video_url) {
            const videoResponse = await fetch(video_url);
            const videoBuffer = await videoResponse.arrayBuffer();

            await fetch(uploadUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'video/mp4'
                },
                body: Buffer.from(videoBuffer)
            });
        }

        return res.status(200).json({
            success: true,
            video_id: videoId,
            message: 'TikTok post initiated. Video is being processed.'
        });

    } catch (error: any) {
        console.error('Error posting to TikTok:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to post to TikTok'
        });
    }
}
