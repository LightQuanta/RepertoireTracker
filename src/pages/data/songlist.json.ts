import { createConfigLoader } from "@/config/configLoader";
import { songSchema } from "@/schema/song";
import type { APIRoute } from "astro";

// TODO 实现歌曲列表获取

const loadExampleSongData = createConfigLoader('src/config/songdata_example.json', songSchema)
const songData = await loadExampleSongData()

export const GET: APIRoute = () => {
    // console.log('song data', songData)
    return new Response(JSON.stringify(songData))
}
