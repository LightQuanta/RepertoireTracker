import { z } from 'astro/zod'
import { createConfigLoader } from './configLoader'

// 站点配置文件
const siteConfigSchema = z.object({
  title: z.string().default('Repertoire Tracker'),
  language: z.string().default('zh-cn'),
})

const loadSiteConfig = createConfigLoader('site.json', siteConfigSchema)

export { loadSiteConfig }
