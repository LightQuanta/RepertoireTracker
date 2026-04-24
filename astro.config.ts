// @ts-check
import { defineConfig } from 'astro/config'
import UnoCSS from 'unocss/astro'
import AutoImport from 'unplugin-auto-import/astro'
import { mockDevServerPlugin } from 'vite-plugin-mock-dev-server'

import vue from '@astrojs/vue'

// https://astro.build/config
export default defineConfig({
  integrations: [
    vue(),
    UnoCSS(),
    AutoImport({
      imports: [
        'vue',
      ],
      dts: true,
    }),
  ],
  vite: {
    plugins: [
      mockDevServerPlugin({
        dir: 'src/dev-server',
        include: ['**/*.ts'],
      }),
    ],
    server: {
      proxy: {
        // 必须得填个host，不然mock不认
        '^/dev': 'placeholder'
      },
    },
  }
});