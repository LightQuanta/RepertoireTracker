import { songSchema } from '@schema/song'
import { createConfigLoader } from './configLoader'

// TODO 也许不该叫loadSongConfig，后续会用该基础配置文件计算其余属性？
const loadSongConfig = createConfigLoader('song.json', songSchema)

export { loadSongConfig }
