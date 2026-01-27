import { pluginOas } from '@kubb/plugin-oas'
import { pluginClient } from '@kubb/plugin-client'
import { pluginTs } from '@kubb/plugin-ts'
import { defineConfig, type UserConfig } from '@kubb/core' // 1. Importe o tipo UserConfig
import { config } from "dotenv"

config();

const {
    API_URL_PLANEJADOR,
    API_SWAGGER_PLANEJADOR,
    API_URL_AUTH,
    API_SWAGGER_AUTH,
    API_URL_RELOGIO,
    API_SWAGGER_RELOGIO,
    API_URL_CERTIFICADOS,
    API_SWAGGER_CERTIFICADOS,
    API_URL_ROUTES,
    API_SWAGGER_ROUTES,
    API_URL_WIFI,
    API_SWAGGER_WIFI
} = process.env as Record<string, string>;

interface ApiConfigParams {
    name: string;
    swaggerPath: string;
    outputPath: string;
    baseUrl: string;
}

// 2. Adicione ': UserConfig' no retorno da função para garantir a tipagem
const createApiConfig = ({ name, swaggerPath, outputPath, baseUrl }: ApiConfigParams): UserConfig => {
    return {
        name,
        root: '.',
        input: { path: swaggerPath },
        output: {
            path: outputPath,
            extension: {
                ".ts": "" as const,
            },
            clean: true,
        },
        plugins: [
            pluginOas(),
            pluginTs({
                output: { path: 'models' },
                dateType: 'date',
                enumType: 'enum',
                syntaxType: 'type'
            }),
            pluginClient({
                output: { path: 'client' },
                client: 'axios',
                importPath: '@/client',
                baseURL: baseUrl,
                dataReturnType: 'data',
            }),
        ],
    }
};

export default defineConfig(() => [
    // createApiConfig({
    //     name: 'auth-api',
    //     swaggerPath: API_SWAGGER_AUTH,
    //     outputPath: './src/api/auth',
    //     baseUrl: API_URL_AUTH
    // }),
    // createApiConfig({
    //     name: 'app-routes-api',
    //     swaggerPath: API_SWAGGER_ROUTES,
    //     outputPath: './src/api/routes',
    //     baseUrl: API_URL_ROUTES
    // }),
    // createApiConfig({
    //     name: 'certificados-api',
    //     swaggerPath: API_SWAGGER_CERTIFICADOS,
    //     outputPath: './src/api/certificados',
    //     baseUrl: API_URL_CERTIFICADOS
    // }),
    // createApiConfig({
    //     name: 'planejador-api',
    //     swaggerPath: API_SWAGGER_PLANEJADOR,
    //     outputPath: './src/api/planejador',
    //     baseUrl: API_URL_PLANEJADOR
    // }),
    // createApiConfig({
    //     name: 'relogio-api',
    //     swaggerPath: API_SWAGGER_RELOGIO,
    //     outputPath: './src/api/relogio',
    //     baseUrl: API_URL_RELOGIO
    // }),
    createApiConfig({
        name: 'relogio-api',
        swaggerPath: API_SWAGGER_RELOGIO,
        outputPath: './src/api/relogio',
        baseUrl: API_URL_RELOGIO
    }),
    createApiConfig({
        name: 'wifi-api',
        swaggerPath: API_SWAGGER_WIFI,
        outputPath: './src/api/wifi',
        baseUrl: API_URL_WIFI
    }),
]);