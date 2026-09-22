import tailwindcss from '@tailwindcss/postcss';
import vinext from 'vinext';
import { defineConfig } from 'vite';

const usePollingForLocalFs = process.env.VITE_USE_POLLING === '1';

const localBindingConfig = {
  main: 'vinext/server/fetch-handler',
  compatibility_flags: ['nodejs_compat'],
  d1_databases: [],
  r2_buckets: [],
};

export default defineConfig(async ({ command }) => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= 'false';
  process.env.WRANGLER_LOG_PATH ??= '.wrangler/logs';
  process.env.MINIFLARE_REGISTRY_PATH ??= '.wrangler/registry';

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import('@cloudflare/vite-plugin');

  return {
    css: { postcss: { plugins: [tailwindcss()] } },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: ['terminal.local'],
      watch: {
        // Generated Pages files are rebuilt atomically and must not be watched on Windows/OneDrive.
        ignored: [
          '**/.pages-dist/**',
          '**/backend/target/**',
          '**/test-results/**',
        ],
        ...(usePollingForLocalFs
          ? { useFsEvents: false, usePolling: true }
          : {}),
      },
    },
    plugins: [
      vinext(),
      cloudflare({
        configPath: './deploy/wrangler.vite.jsonc',
        viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
        // Only isolated local QA may override persistence/secrets; never embed these in a build.
        ...(command === 'serve' && process.env.STORE_LOCAL_TEST === '1'
          ? { persistState: { path: '.wrangler/store-tests' } }
          : {}),
        config: {
          ...localBindingConfig,
          ...(command === 'serve' && process.env.STORE_LOCAL_TEST === '1'
            ? {
                d1_databases: [
                  {
                    binding: 'DB',
                    database_name: 'tesoob-test',
                    database_id: 'fe8e6d77-722b-45f7-b774-10f07c66e128',
                  },
                ],
                r2_buckets: [
                  {
                    binding: 'STORE_IMAGES',
                    bucket_name: 'tesoob-test-media',
                  },
                ],
                vars: { STORE_AES_KEY: process.env.STORE_LOCAL_AES_KEY || '' },
              }
            : {}),
        },
      }),
    ],
  };
});
