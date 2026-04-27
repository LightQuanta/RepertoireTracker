import { z } from 'astro/zod'
import { createConfigLoader } from './configProcesser'

// 站点配置文件
const siteConfigSchema = z.object({
    title: z.string().default('Repertoire Tracker'),
})

const loadSiteConfig = createConfigLoader('/custom/config/site.json', siteConfigSchema)

export { loadSiteConfig }
