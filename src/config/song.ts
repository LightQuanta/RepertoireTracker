import { z } from 'astro/zod'
import { createConfigLoader } from './configLoader'

// 歌曲配置文件
const songSchema = z.object({
    songs: z.array(
        z.object({
            id: z.uuidv4(),
            title: z.string(),
            subtitle: z.string().optional(),
            artist: z.string().optional(),
            description: z.string().optional(),
            tags: z.set(z.string()).default(new Set()),
        })
    ).default([]),
})

// TODO 也许不该叫loadSongConfig，后续会用该基础配置文件计算其余属性？
const loadSongConfig = createConfigLoader('/custom/config/song.json', songSchema)

export { loadSongConfig }
