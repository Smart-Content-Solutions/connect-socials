// Increase the body size limit for this API route
export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
    },
};

const N8N_WEBHOOK_URL = "https://n8n.smartcontentsolutions.co.uk/webhook/seo-content-publisher";

// Timeout for n8n request (5 seconds) - we don't wait for the full workflow
const N8N_TIMEOUT_MS = 5000;

export default async function handler(req: any, res: any) {
    // Set CORS headers for all responses
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const body = req.body;

        if (!body) {
            return res.status(400).json({ success: false, error: 'No request body provided' });
        }

        // Validate required fields before sending to n8n
        if (!body.topic || body.topic.trim() === '') {
            return res.status(400).json({ success: false, error: 'Topic is required' });
        }
        if (!body.wp_url || body.wp_url.trim() === '') {
            return res.status(400).json({ success: false, error: 'WordPress URL is required' });
        }
        if (!body.wp_username || body.wp_username.trim() === '') {
            return res.status(400).json({ success: false, error: 'WordPress username is required' });
        }
        if (!body.wp_app_password || body.wp_app_password.trim() === '') {
            return res.status(400).json({ success: false, error: 'WordPress app password is required' });
        }

        // Create FormData for n8n (n8n workflows expect form data)
        const formData = new FormData();

        // Always append all required fields (use empty string if not provided)
        formData.append('topic', body.topic || '');
        formData.append('sections', body.sections || '3');
        formData.append('keywords', body.keywords || '');
        formData.append('location', body.location || '');
        formData.append('occupation', body.occupation || '');
        formData.append('audience', body.audience || '');
        formData.append('tone', body.tone || 'Professional');
        formData.append('wp_url', body.wp_url || '');
        formData.append('wp_username', body.wp_username || '');
        formData.append('wp_app_password', body.wp_app_password || '');

        // Handle image if present (base64 encoded from frontend)
        if (body.image && body.imageName) {
            try {
                const imageBuffer = Buffer.from(body.image, 'base64');
                const blob = new Blob([imageBuffer]);
                formData.append('image', blob, body.imageName);
            } catch (imgError) {
                console.warn('Failed to process image, continuing without it:', imgError);
            }
        }

        console.log('Forwarding request to n8n webhook:', N8N_WEBHOOK_URL);
        console.log('Request data:', {
            topic: body.topic,
            location: body.location,
            wp_url: body.wp_url,
            hasImage: !!body.image,
        });

        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), N8N_TIMEOUT_MS);

        try {
            // Forward to n8n with timeout
            const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                body: formData,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            // If we got a response, n8n received it
            console.log('n8n response status:', n8nResponse.status);

            // Any 2xx response means n8n accepted the request
            if (n8nResponse.ok) {
                return res.status(200).json({
                    success: true,
                    message: 'Automation started successfully! Your post will appear in drafts within 4-5 minutes.',
                    mode: 'confirmed'
                });
            } else {
                // n8n returned an error
                const responseText = await n8nResponse.text();
                console.error('n8n webhook error:', n8nResponse.status, responseText);
                return res.status(n8nResponse.status).json({
                    success: false,
                    error: 'n8n workflow error',
                    details: responseText
                });
            }
        } catch (fetchError: any) {
            clearTimeout(timeoutId);

            // Check if this was a timeout (AbortError)
            if (fetchError.name === 'AbortError') {
                // Timeout means n8n received the request but is still processing
                // This is expected behavior - the workflow takes 4-5 minutes
                console.log('n8n request timed out (expected - workflow is processing in background)');
                return res.status(200).json({
                    success: true,
                    message: 'Automation started! n8n is processing your request. Your post will appear in drafts within 4-5 minutes.',
                    mode: 'fire_and_forget'
                });
            }

            // Other fetch errors (network issues, etc.)
            throw fetchError;
        }
    } catch (error: any) {
        console.error('Error forwarding to n8n:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to forward request to n8n',
            details: error.message
        });
    }
}
