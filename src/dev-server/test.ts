import { defineMock } from 'vite-plugin-mock-dev-server'


export default defineMock([{
    url: '/dev/users',
    method: 'POST',
    body: (req) => {
        return { code: 0, body: req.body, data: 'test' }
    }
}])