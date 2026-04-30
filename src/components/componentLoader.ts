import type { AstroInstance } from "astro"

const components = import.meta.glob('**/*.astro', { eager: true })

const createAstroComponentLoader = <T extends AstroInstance>(path: string) => async () => {
    if (components[path]) {
        const loader = components[path] as T
        return loader.default
    }
    throw new Error(`Component not found: ${path}`)
}

export { createAstroComponentLoader }