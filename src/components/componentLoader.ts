import type { AstroInstance } from "astro"

const components = import.meta.glob('**/*.astro')

// TODO 导入的astro组件不支持vite HMR
const createAstroComponentLoader = <T extends AstroInstance>(path: string) => async () => {
    if (components[path]) {
        const loader = components[path]() as Promise<T>
        return (await loader).default
    }
    throw new Error(`Component not found: ${path}`)
}

export { createAstroComponentLoader }