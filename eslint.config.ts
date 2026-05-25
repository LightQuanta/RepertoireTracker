import antfu from '@antfu/eslint-config'

export default antfu({
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
})
