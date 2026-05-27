import { z } from 'astro/zod'

const types = ['string', 'integer', 'float', 'boolean', 'tags', 'date'] as const
const propertyType = z.enum(types)

type SongPropertyKeys = typeof types[number]

// 自定义歌曲属性类型映射
const typeMap: Record<SongPropertyKeys, z.ZodType> = {
  string: z.string(),
  integer: z.int(),
  float: z.number(),
  boolean: z.boolean(),
  tags: z.array(z.string()),
  date: z.date(),
}

const songPropertySchema = z.object({
  // 属性ID，用于序列化和反序列化
  id: z.string(),
  // 显示名称
  displayName: z.string(),
  // 是否可选（必须和默认值二选一！）
  optional: z.boolean().default(false),
  // 是否展示给普通用户
  show: z.boolean().default(true),
  // 属性类型
  type: propertyType,
  // 默认值（必须和可选二选一！）
  default: z.any().optional(),
  // 搜索权重
  searchWeight: z.number().default(0),
})

type SongProperty = z.infer<typeof songPropertySchema>

function getPropertySchema(property: SongProperty): z.ZodType<any> {
  const type = typeMap[property.type]
  if (property.optional ?? false) {
    return type.optional()
  }
  return type
}

// 自定义歌曲属性
const songPropertiesSchema = z.array(songPropertySchema).default([
  {
    id: 'title',
    displayName: '标题',
    type: 'string',
    searchWeight: 150,
    show: true,
    optional: false,
    default: '',
  },
  {
    id: 'subtitle',
    displayName: '副标题',
    type: 'string',
    searchWeight: 50,
    show: true,
    optional: true,
  },
  {
    id: 'alias',
    displayName: '别名',
    type: 'tags',
    searchWeight: 50,
    show: true,
    optional: true,
  },
  {
    id: 'artist',
    displayName: '艺术家',
    type: 'tags',
    searchWeight: 50,
    show: true,
    optional: false,
    default: [],
  },
  {
    id: 'language',
    displayName: '语言',
    type: 'tags',
    searchWeight: 20,
    show: true,
    optional: false,
    default: [],
  },
  {
    id: 'description',
    displayName: '描述',
    type: 'string',
    searchWeight: 20,
    show: true,
    optional: true,
  },
  {
    id: 'tags',
    displayName: '标签',
    type: 'tags',
    searchWeight: 20,
    show: true,
    optional: false,
    default: [],
  },
  {
    id: 'count',
    displayName: '演唱次数',
    type: 'integer',
    searchWeight: 0,
    show: true,
    optional: false,
    default: 0,
  },
  {
    id: 'lastSingDate',
    displayName: '最近演唱',
    type: 'date',
    searchWeight: 0,
    show: true,
    optional: true,
  },
])

const songSchema = z.object({
  id: z.uuidv4(),

  // 可区分类型的自定义属性
  properties: z.record(z.string(), z.any()).default({}),
})

// 单首歌曲信息
type SongInfo = z.infer<typeof songSchema>

// 歌曲配置文件
const songDataSchema = z.object({
  // 所有歌曲共享的自定义属性
  properties: songPropertiesSchema,

  // 歌曲列表
  songs: z.array(songSchema).default([]),
})

// 所有歌曲的歌曲列表和对应属性定义
type SongData = z.infer<typeof songDataSchema>

export { getPropertySchema, songDataSchema, songPropertySchema, songSchema, types }
export type { SongData, SongInfo, SongProperty, SongPropertyKeys }
