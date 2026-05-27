import vue from '@astrojs/vue'
// @ts-check
import { defineConfig } from 'astro/config'
import UnoCSS from 'unocss/astro'
import AutoImport from 'unplugin-auto-import/astro'

import { mockDevServerPlugin } from 'vite-plugin-mock-dev-server'

// https://astro.build/config
export default defineConfig({
  integrations: [
    vue({
      appEntrypoint: './src/plugins/vue-app.ts',
    }),
    UnoCSS({
      injectReset: true, // or a path to the reset file
    }),
    AutoImport({
      imports: ['vue'],
      dts: true,
    }),
  ],
  vite: {
    plugins: [
      mockDevServerPlugin({
        dir: 'src/dev-server',
        include: ['**/*.ts'],
      }),

      // TODO 为SongListEditor.vue抑制HMR使用，但该实现是否合适？
      {
        name: 'suppress-custom-config-hmr',
        handleHotUpdate({ file }) {
          if (file.includes('\\custom\\config\\') || file.includes('/custom/config/')) {
            return []
          }
        },
      },
    ],
    server: {
      proxy: {
        // 必须得填个host，不然mock不认
        '^/dev': 'placeholder',
      },
    },
  },
})
