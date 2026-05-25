import type { z } from 'astro/zod'

const configFiles = import.meta.glob(['/custom/config/*.json', '/src/config/*.json'])

type ConfigLoader<T extends z.ZodObject<any>> = {
  load: () => Promise<z.output<T>>
  path: string
  schema: T
  expose: boolean // 是否将配置文件暴露于`/public/${path}`下
}

// 所有已注册的配置文件加载器，用于生成路由
const allConfigLoaders: ConfigLoader<any>[] = []

/**
 * 创建配置文件加载器，读取 JSON 配置文件并由 ZodObject 进行转换
 * @param path 配置文件路径（`/custom/config/${path}`, `/src/config/${path}`）
 * @param schema 配置文件 zodObject（必须确保所有字段都有默认值或为可选值！）
 * @param expose 是否将配置文件暴露于`/public/${path}`下
 */
function createConfigLoader<T extends z.ZodObject<any>>(path: string, schema: T, expose: boolean = false): ConfigLoader<T> {
  const loader = { load: async () => {
    try {
      const configLoader = configFiles[`/custom/config/${path}`] ?? configFiles[`/src/config/${path}`]

      if (!configLoader) {
        // console.warn(`配置文件 ${path} 未找到`)
        return schema.parse({})
      }

      const configModule = await configLoader()
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
  }, path, schema, expose }

  allConfigLoaders.push(loader)
  return loader
}

/**
 * 更新配置文件内容(仅在开发环境下有效)
 * @param configLoader 配置文件加载器
 * @param value 配置文件新值
 * @returns 是否成功更新配置文件
 */
async function reloadConfig<T extends z.ZodObject<any>>(configLoader: ConfigLoader<T>, value: z.input<T>) {
  if (import.meta.env.DEV) {
    const resp = await fetch('/dev/config/save', {
      method: 'POST',
      body: JSON.stringify({ path: configLoader.path, config: value }),
    }).then(d => d.json())

    if (resp.code !== 0) {
      console.error('配置文件保存失败', resp)
      return false
    }
    return true
  }
  else {
    console.warn('非开发环境，无法更新配置文件，请检查调用')
  }
}

export { allConfigLoaders, configFiles, createConfigLoader, reloadConfig }
