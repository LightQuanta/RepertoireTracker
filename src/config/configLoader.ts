import type { z } from 'astro/zod'

const configFiles = import.meta.glob('/**/*.json', { eager: true })

/**
 * 创建配置文件加载器，读取 JSON 配置文件并由 ZodObject 进行转换
 * @param path 配置文件路径（相对于项目根目录，如 'custom/config/song.json'）
 * @param schema 配置文件 zodObject（必须确保所有字段都有默认值或为可选值！）
 */
function createConfigLoader<T extends z.ZodObject<any>>(path: string, schema: T) {
  return async () => {
    try {
      const configModule = configFiles[path]

      if (!configModule) {
        // console.warn(`配置文件 ${path} 未找到`)
        return schema.parse({})
      }

      const config = (configModule as any).default

      const result = schema.safeParse(config)
      if (!result.success) {
        console.warn('配置文件解析失败', result.error)
        return schema.parse({})
      }

      return result.data
    }
    catch (error) {
      console.error(error)
      return schema.parse({})
    }
  }
}

export { createConfigLoader }
