import { songSchema } from '@schema/song'
import { createConfigLoader } from './configLoader'

const songConfigLoader = createConfigLoader('song.json', songSchema)

export { songConfigLoader }
