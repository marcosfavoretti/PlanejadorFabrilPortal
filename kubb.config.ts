import { pluginOas } from '@kubb/plugin-oas'
import { pluginClient } from '@kubb/plugin-client'
import { pluginTs } from '@kubb/plugin-ts'
import { defineConfig, type UserConfig } from '@kubb/core'
import { config as loadDotenv } from 'dotenv'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * `npm run generate --production` does not forward the flag to the command;
 * npm exposes it as npm_config_production instead. Kubb itself can receive
 * the flag when the command is invoked as `npm run generate -- --production`.
 */
const isProductionGeneration =
    process.argv.includes('--production') || process.env.npm_config_production === 'true';

const envFiles = isProductionGeneration
    ? ['.env.production', '.env.prod', '.env']
    : ['.env'];

for (const envFile of envFiles) {
    const envPath = resolve(process.cwd(), envFile);
    if (existsSync(envPath)) {
        loadDotenv({ path: envPath });
    }
}

const configuredApiHost = process.env.KUBB_API_HOST?.trim();

function resolveApiUrl(value: string): string {
    if (!configuredApiHost) {
        return value;
    }

    const url = new URL(value);
    const targetHost = new URL(
        configuredApiHost.includes('://') ? configuredApiHost : `https://${configuredApiHost}`,
    );
    url.protocol = targetHost.protocol;
    url.host = targetHost.host;
    return url.toString();
}

function resolveApiBaseUrl(value: string): string {
    return new URL(resolveApiUrl(value)).origin;
}

const {
    API_URL_PROD_FABRICA,
    API_SWAGGER_PROD_FABRICA,
    API_URL_MOBILE,
    API_SWAGGER_MOBILE,
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
    API_SWAGGER_WIFI,
    API_URL_BUFFER,
    API_SWAGGER_BUFFER,
    API_URL_PBINDEX,
    API_SWAGGER_PBINDEX,
    API_URL_PORTARIA,
    API_SWAGGER_PORTARIA,
    API_URL_ESTRUTURA,
    API_SWAGGER_ESTRUTURA,
    API_URL_AUDIT,
    API_SWAGGER_AUDIT,
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
        input: { path: resolveApiUrl(swaggerPath) },
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
                syntaxType: 'type',
            }),
            pluginClient({
                output: { path: 'client' },
                client: 'axios',
                importPath: '@/client',
                baseURL: resolveApiBaseUrl(baseUrl),
                dataReturnType: 'data',
            }),
        ],
    }
};

export default defineConfig(() => [
    createApiConfig({
        name: 'auth-api',
        swaggerPath: API_SWAGGER_AUTH,
        outputPath: './src/api/auth',
        baseUrl: API_URL_AUTH
    }),
    createApiConfig({
        name: 'audit-api',
        swaggerPath: API_SWAGGER_AUDIT,
        outputPath: './src/api/audit',
        baseUrl: API_URL_AUDIT
    }),
    createApiConfig({
        name: 'app-routes-api',
        swaggerPath: API_SWAGGER_ROUTES,
        outputPath: './src/api/routes',
        baseUrl: API_URL_ROUTES
    }),
    createApiConfig({
        name: 'certificados-api',
        swaggerPath: API_SWAGGER_CERTIFICADOS,
        outputPath: './src/api/certificados',
        baseUrl: API_URL_CERTIFICADOS
    }),
    createApiConfig({
        name: 'planejador-api',
        swaggerPath: API_SWAGGER_PLANEJADOR,
        outputPath: './src/api/planejador',
        baseUrl: API_URL_PLANEJADOR
    }),
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
    createApiConfig({
        name: 'buffer-api',
        swaggerPath: API_SWAGGER_BUFFER,
        outputPath: './src/api/buffer',
        baseUrl: API_URL_BUFFER
    }),
    createApiConfig({
        name: 'pbindex-api',
        swaggerPath: API_SWAGGER_PBINDEX,
        outputPath: './src/api/pbindex',
        baseUrl: API_URL_PBINDEX
    }),
    createApiConfig({
        name: 'portaria-api',
        swaggerPath: API_SWAGGER_PORTARIA,
        outputPath: './src/api/portaria',
        baseUrl: API_URL_PORTARIA
    }),
    createApiConfig({
        name: 'estrutura-api',
        swaggerPath: API_SWAGGER_ESTRUTURA,
        outputPath: './src/api/estrutura',
        baseUrl: API_URL_ESTRUTURA
    }),
    createApiConfig({
        name: 'mobile-api',
        swaggerPath: API_SWAGGER_MOBILE,
        outputPath: './src/api/mobile',
        baseUrl: API_URL_MOBILE
    }),
    createApiConfig({
        name: 'producao-fabrica',
        swaggerPath: API_SWAGGER_PROD_FABRICA,
        outputPath: './src/api/proucao-fabrica',
        baseUrl: API_URL_PROD_FABRICA
    }),
]);
