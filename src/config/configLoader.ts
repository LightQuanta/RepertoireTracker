import { z } from 'astro/zod'

/**
 * 创建配置文件加载器，优先尝试从自定义目录加载配置文件并由ZodObject进行转换
 * @param path 配置文件路径
 * @param schema 配置文件zodObject（必须确保所有字段都有默认值或为可选值！）
 */
const createConfigLoader = <T extends z.ZodObject<any>>(path: string, schema: T) => async () => {
    try {
        const config = await import(/* @vite-ignore */ path)

        // TODO 更合适的警告方式？
        const result = schema.safeParse(config)
        if (!result.success) {
            console.warn('配置文件解析失败', result.error)
            return schema.parse({})
        }

        return result.data
    } catch (error) {
        return schema.parse({})
    }
}

export { createConfigLoader }