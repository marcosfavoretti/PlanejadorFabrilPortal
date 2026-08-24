import { defineConfig } from '@kubb/core';
import { pluginClient } from '@kubb/plugin-client';
import { pluginOas } from '@kubb/plugin-oas';
import { pluginTs } from '@kubb/plugin-ts';

export default defineConfig({
  root: '.',
  input: { path: './openapi/production-history.yaml' },
  output: { path: './src/api/production-history', clean: true, extension: { '.ts': '' as const } },
  plugins: [
    pluginOas(),
    pluginTs({ output: { path: 'models' }, syntaxType: 'type' }),
    pluginClient({
      output: { path: 'client' },
      client: 'axios',
      importPath: '@/client',
      baseURL: 'https://app.ethos.ind.br/api',
      dataReturnType: 'data',
    }),
  ],
});
