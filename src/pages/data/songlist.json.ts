import type { APIRoute } from 'astro'
import { songConfigLoader } from '@/config/song'

export const GET: APIRoute = async () => {
  // console.log('song data', songData)
  return new Response(JSON.stringify(await songConfigLoader.load()))
}
