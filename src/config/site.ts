import { z } from 'astro/zod'

const siteConfigSchema = z.object({
  title: z.string().default('Repertoire Tracker'),
  language: z.string().default('zh-cn'),
})

export { siteConfigSchema }
