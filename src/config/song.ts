import { songSchema } from '@schema/song'
import { createConfigLoader } from './configLoader'

const songConfigLoader = createConfigLoader('songdata.json', songSchema)

export { songConfigLoader }
