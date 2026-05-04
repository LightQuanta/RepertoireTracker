import type { APIRoute } from "astro";

// TODO 实现歌曲列表获取
export const GET: APIRoute = () => new Response(JSON.stringify({
    songs: [{
        id: '4c6ec2b1-fcbb-4d7f-a19e-ab0976ddef3d',
        properties: {
            title: 'Test Song',
            artist: ['Test Artist'],
        },
    }],
}))
