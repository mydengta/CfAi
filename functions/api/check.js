export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const body = await request.json();
        const { accountId, token, model } = body;

        if (!accountId || !token) {
            return new Response(JSON.stringify({
                success: false,
                message: '缺少 accountId 或 token 参数'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const baseURL = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1/chat/completions`;

        const cfResponse = await fetch(baseURL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: model || '@cf/moonshotai/kimi-k2.6',
                messages: [
                    { role: 'system', content: 'You are a helpful assistant. Reply with "OK" only.' },
                    { role: 'user', content: 'Hello!' }
                ],
                max_tokens: 5
            })
        });

        const data = await cfResponse.json();

        if (cfResponse.ok && data.success !== false && (data.result || data.choices)) {
            return new Response(JSON.stringify({
                success: true,
                statusCode: cfResponse.status,
                message: '凭据可用'
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        let errorMsg = '凭据无效或权限不足';
        if (data.errors && data.errors.length > 0) {
            errorMsg = data.errors.map(e => e.message || e).join(', ');
        } else if (data.message) {
            errorMsg = data.message;
        }

        return new Response(JSON.stringify({
            success: false,
            statusCode: cfResponse.status,
            message: errorMsg
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            statusCode: 0,
            message: error.message || '服务器内部错误'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
