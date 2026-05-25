import type { App } from 'vue'
import { ID_INJECTION_KEY, provideGlobalConfig, ZINDEX_INJECTION_KEY } from 'element-plus'

import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/theme-chalk/dark/css-vars.css'

export default function (app: App) {
  // TODO 能否实现语言选择？
  provideGlobalConfig({ locale: zhCn }, app)

  app.provide(ID_INJECTION_KEY, { prefix: 0, current: 0 })
  app.provide(ZINDEX_INJECTION_KEY, { current: 0 })
}
