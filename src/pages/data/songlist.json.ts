import type { APIRoute } from 'astro'
import { createConfigLoader } from '@/config/configLoader'
import { songSchema } from '@/schema/song'

// TODO 实现歌曲列表获取

const loadExampleSongData = createConfigLoader('/src/config/songdata_example.json', songSchema)

export const GET: APIRoute = async () => {
  // console.log('song data', songData)
  return new Response(JSON.stringify(await loadExampleSongData()))
}
