import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { defineMock } from 'vite-plugin-mock-dev-server'

type SaveConfigParam = {
  path: string
  config: any
}

export default defineMock([{
  url: '/dev/config/save',
  method: 'POST',
  body: (req) => {
    const param = JSON.parse(req.body as unknown as string) as SaveConfigParam

    try {
      writeFileSync(`custom/config/${param.path}`, JSON.stringify(param.config))
      return { code: 0 }
    }
    catch (error) {
      console.error(error)
      return { code: 114, data: error }
    }
  },
}, {
  url: '/dev/config/get',
  method: 'POST',
  body: (req) => {
    const param = JSON.parse(req.body as unknown as string) as { path: string }
    const path = param.path
    try {
      if (existsSync(`custom/config/${path}`)) {
        return { code: 0, data: JSON.parse(readFileSync(`custom/config/${path}`, 'utf-8')) }
      }
      else if (existsSync(`src/config/${path}`)) {
        return { code: 0, data: JSON.parse(readFileSync(`src/config/${path}`, 'utf-8')) }
      }

      // 这样返回是否合适？
      return { code: 0, data: {} }
    }
    catch (error) {
      console.error(error)
      return { code: 114, data: error }
    }
  },
}, {
  url: '/dev/config/reset',
  method: 'POST',
  body: (req) => {
    const param = JSON.parse(req.body as unknown as string) as { path: string }
    const path = param.path
    try {
      if (existsSync(`custom/config/${path}`)) {
        unlinkSync(`custom/config/${path}`)
      }
      return { code: 0 }
    }
    catch (error) {
      console.error(error)
      return { code: 114, data: error }
    }
  },
}])
