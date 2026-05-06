import { z } from 'astro/zod'

// TODO byd有没有个正常的读取方式😅
const projectRoot = new URL(import.meta.env.PROD ? '../../../' : '../../', import.meta.url);

/**
 * 创建配置文件加载器，优先尝试从自定义目录加载配置文件并由ZodObject进行转换
 * @param path 配置文件路径
 * @param schema 配置文件zodObject（必须确保所有字段都有默认值或为可选值！）
*/
const createConfigLoader = <T extends z.ZodObject<any>>(path: string, schema: T) => async () => {
    try {
        const absolutePath = new URL(path, projectRoot).href
        // console.log('absolutePath', absolutePath)
        // console.log('projectRoot', projectRoot.href)

        let config: any = null
        if (import.meta.env.PROD) {
            // TODO byd有没有个正常的读取方式😅
            const fs = await import('fs')
            config = JSON.parse(fs.readFileSync(absolutePath.substring('file:///'.length), 'utf-8'))
        } else {
            config = await import(/* @vite-ignore */ absolutePath)
        }

        // TODO 更合适的警告方式？
        const result = schema.safeParse(config)
        if (!result.success) {
            console.warn('配置文件解析失败', result.error)
            return schema.parse({})
        }

        return result.data
    } catch (error) {
        console.error(error)
        return schema.parse({})
    }
}

export { createConfigLoader }