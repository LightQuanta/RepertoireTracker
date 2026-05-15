import type { AstroInstance } from 'astro'

const components = import.meta.glob('/**/*.astro', { eager: true })

// console.log(Object.keys(components))

function createAstroComponentLoader<T extends AstroInstance>(path: string) {
  return async () => {
    if (components[path]) {
      const loader = components[path] as T
      return loader.default
    }
    throw new Error(`Component not found: ${path}`)
  }
}

export { createAstroComponentLoader }
