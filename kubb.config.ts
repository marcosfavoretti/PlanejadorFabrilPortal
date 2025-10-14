import { pluginOas } from '@kubb/plugin-oas'
import { pluginClient } from '@kubb/plugin-client'
import { pluginTs } from '@kubb/plugin-ts'
import { defineConfig } from '@kubb/core'
import { config } from "dotenv"
config()
const API_URL = process.env?.['API_URL']!//|| 'http://localhost:3000'
const API_SWAGGER = process.env?.['API_SWAGGER']!// || 'http://localhost:3000/swagger.json'

export default defineConfig(() => ({
    input: { path: API_SWAGGER },
    output: {
        path: './src/api', extension: {
            '.ts': '',
        },
    },
    plugins: [
        pluginOas(),
        pluginTs({
            output:
                { path: 'models' },
            dateType: 'date',
            enumType: 'enum',
            syntaxType: 'type'
        }),
        pluginClient({
            output: { path: 'client' },
            client: 'axios',
            importPath: '@/client',
            baseURL: API_URL,
        }),
    ],
}))