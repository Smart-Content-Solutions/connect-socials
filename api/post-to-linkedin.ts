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
        const { user_id, text, image_url, link } = req.body;

        if (!user_id) {
            return res.status(400).json({ success: false, error: 'user_id is required' });
        }
        if (!text) {
            return res.status(400).json({ success: false, error: 'text is required' });
        }

        const supabaseUrl = process.env.SUPABASE_SCS_URL || "https://wbhfbcqcefbnsjvqmjte.supabase.co";
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiaGZiY3FjZWZibnNqdnFtanRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE2NTY2MiwiZXhwIjoyMDc5NzQxNjYyfQ.0AT9XjB1GHDr94wY5Tm-oIhE8uBxvRafhgAx7akNrV8";

        if (!supabaseServiceKey) {
            return res.status(500).json({ success: false, error: 'Server configuration error' });
        }

        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { data: credData, error: credError } = await supabase
            .from('user_social_credentials')
            .select('credentials')
            .eq('user_id', user_id)
            .eq('platform', 'linkedin')
            .single();

        if (credError || !credData) {
            return res.status(404).json({ success: false, error: 'LinkedIn not connected' });
        }

        const credentials = credData.credentials;
        const accessToken = credentials.access_token;
        const linkedinUserId = credentials.linkedin_user_id;

        let postData: any = {
            author: `urn:li:person:${linkedinUserId}`,
            lifecycleState: 'PUBLISHED',
            specificContent: {
                'com.linkedin.ugc.ShareContent': {
                    'shareCommentary': {
                        'text': text
                    },
                    'shareMediaCategory': image_url ? 'IMAGE' : 'NONE'
                }
            },
            visibility: {
                'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
            }
        };

        if (image_url) {
            const imageUploadResponse = await fetch(
                'https://api.linkedin.com/v2/assets?action=registerUpload',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        registerUploadRequest: {
                            recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
                            owner: `urn:li:person:${linkedinUserId}`,
                            serviceRelationships: [{
                                relationshipType: 'OWNER',
                                identifier: 'urn:li:userGeneratedContent'
                            }]
                        }
                    })
                }
            );

            const uploadData = await imageUploadResponse.json();

            if (uploadData.value && uploadData.value.asset) {
                const assetUrn = uploadData.value.asset;
                
                await fetch(
                    `https://api.linkedin.com/v2/assets/${encodeURIComponent(assetUrn)}`,
                    {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/octet-stream'
                        },
                        body: image_url
                    }
                );

                postData.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'IMAGE';
                postData.specificContent['com.linkedin.ugc.ShareContent'].media = [{
                    status: 'READY',
                    originalUrl: image_url,
                    asset: assetUrn
                }];
            }
        }

        if (link) {
            postData.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'ARTICLE';
            postData.specificContent['com.linkedin.ugc.ShareContent'].media = [{
                status: 'READY',
                originalUrl: link
            }];
        }

        const postResponse = await fetch(
            'https://api.linkedin.com/v2/ugcPosts',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(postData)
            }
        );

        const postResult = await postResponse.json();

        if (!postResponse.ok) {
            console.error('LinkedIn API error:', postResult);
            return res.status(400).json({
                success: false,
                error: postResult.message || 'Failed to post to LinkedIn'
            });
        }

        return res.status(200).json({
            success: true,
            post_id: postResult.id,
            message: 'Posted to LinkedIn successfully'
        });

    } catch (error: any) {
        console.error('Error posting to LinkedIn:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to post to LinkedIn'
        });
    }
}
