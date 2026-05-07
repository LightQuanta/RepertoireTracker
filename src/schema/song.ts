import { z } from 'astro/zod'
const types = ['string', 'integer', 'float', 'boolean', 'tags', 'date'] as const
const propertyType = z.enum(types)

type PropertyKeys = typeof types[number]

// 自定义歌曲属性类型映射
const typeMap: Record<PropertyKeys, z.ZodType> = {
    string: z.string(),
    integer: z.int(),
    float: z.number(),
    boolean: z.boolean(),
    tags: z.array(z.string()),
    date: z.date(),
}

const propertySchema = z.object({
    // 属性ID，用于序列化和反序列化
    id: z.string(),
    // 显示名称
    displayName: z.string(),
    // 是否可选
    optional: z.boolean().optional(),
    // 是否展示给普通用户
    show: z.boolean().optional(),
    // 属性类型
    type: propertyType,
    // 默认值
    default: z.any().optional(),
    // 搜索权重
    // TODO 实装搜索权重
    searchWeight: z.number().default(0),
})

type PropertyType = z.infer<typeof propertySchema>

function getPropertySchema(property: PropertyType): z.ZodType<any> {
    const type = typeMap[property.type]
    if (property.optional ?? false) {
        return type.optional()
    }
    return type
}

// 自定义歌曲属性
const songPropertiesSchema = z.array(propertySchema).default([
    {
        id: 'title',
        displayName: '标题',
        type: 'string',
        searchWeight: 1,
    },
    {
        id: 'subtitle',
        displayName: '副标题',
        optional: true,
        type: 'string',
        searchWeight: 0.5,
    },
    {
        id: 'alias',
        displayName: '别名',
        optional: true,
        type: 'tags',
        searchWeight: 0.5,
    },
    {
        id: 'artist',
        displayName: '艺术家',
        default: [],
        type: 'tags',
        searchWeight: 0.5,
    },
    {
        id: 'language',
        displayName: '语言',
        default: [],
        type: 'tags',
        searchWeight: 0.2,
    },
    {
        id: 'description',
        displayName: '描述',
        optional: true,
        type: 'string',
        searchWeight: 0.2,
    },
    {
        id: 'tags',
        displayName: '标签',
        default: [],
        type: 'tags',
        searchWeight: 0.2,
    },
    {
        id: 'count',
        displayName: '演唱次数',
        optional: true,
        type: 'integer',
        default: 0,
        searchWeight: 0,
    },
    {
        id: 'lastSingDate',
        displayName: '最近演唱',
        optional: true,
        type: 'date',
        searchWeight: 0,
    },
])

// 歌曲配置文件
const songSchema = z.object({
    // 所有歌曲共享的自定义属性
    properties: songPropertiesSchema,

    // 歌曲列表
    songs: z.array(z.object({
        id: z.uuidv4(),

        // 可区分类型的自定义属性
        properties: z.record(z.string(), z.any()).default({}),
    })).default([]),
})

export { types, songSchema, propertySchema, getPropertySchema }
export type { PropertyKeys, PropertyType }