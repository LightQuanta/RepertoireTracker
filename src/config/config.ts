import { songDataSchema } from '@/config/song'
import { createConfigLoader } from './configLoader'
import { siteConfigSchema } from './site'

const siteConfigLoader = createConfigLoader('site.json', siteConfigSchema, true)
const songConfigLoader = createConfigLoader('songdata.json', songDataSchema, true)

export { siteConfigLoader, songConfigLoader }
