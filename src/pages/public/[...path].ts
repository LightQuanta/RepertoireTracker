import type { APIRoute, GetStaticPaths } from 'astro'
import { allConfigLoaders } from '@/config/configLoader'
import '@/config/config'

export const getStaticPaths: GetStaticPaths = () => allConfigLoaders
  .filter(loader => loader.expose)
  .map(loader => ({ params: { path: loader.path } }))

export const GET: APIRoute = async ({ params }) => {
  const loader = allConfigLoaders.find(loader => loader.path === params.path && loader.expose)

  if (!loader) {
    return new Response(null, { status: 404 })
  }

  return new Response(JSON.stringify(await loader.load()))
}
