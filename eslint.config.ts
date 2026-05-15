import antfu from '@antfu/eslint-config'

export default antfu(
  {
    astro: true,
    vue: true,
    typescript: true,
    ignores: [
      'dist/**',
      '.astro/**',
      'custom/**',
      'auto-imports.d.ts',
    ],
    rules: {
      'no-console': 'warn',
      'ts/consistent-type-definitions': ['error', 'type'],
    },
  },
  {
    files: ['**/*.vue'],
    rules: {
      'vue/block-order': ['error', {
        order: [['script', 'template'], 'style'],
      }],
      'vue/define-macros-order': ['error', {
        order: ['defineOptions', 'defineProps', 'defineEmits', 'defineSlots'],
      }],
    },
  },
)
