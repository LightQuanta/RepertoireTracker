// @ts-check
import { defineConfig } from 'astro/config'
import UnoCSS from 'unocss/astro'
import AutoImport from 'unplugin-auto-import/astro'

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
  ]
});