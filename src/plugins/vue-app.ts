import type { App } from 'vue'
import ElementPlus, { ID_INJECTION_KEY, ZINDEX_INJECTION_KEY } from 'element-plus'

import zhCn from 'element-plus/es/locale/lang/zh-cn'

export default function (app: App) {
  app.use(ElementPlus, {
    // TODO 能否实现语言选择？
    locale: zhCn,
  })

  app.provide(ID_INJECTION_KEY, { prefix: 0, current: 0 })
  app.provide(ZINDEX_INJECTION_KEY, { current: 0 })
}
