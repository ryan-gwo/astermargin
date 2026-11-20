import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const agentCoreSrc = fileURLToPath(new URL('./packages/agent-core/src', import.meta.url));
const agentUiSrc = fileURLToPath(new URL('./packages/agent-ui/src', import.meta.url));
const agentExportSrc = fileURLToPath(new URL('./packages/agent-export/src', import.meta.url));
const agentLocalSrc = fileURLToPath(new URL('./packages/agent-local/src', import.meta.url));

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        // Isolate native SQLite/WASM dependencies between test workers.
        pool: 'forks',
        maxWorkers: 3,
        minWorkers: 1,
        include: ['tests/unit/**/*.test.ts'],
        setupFiles: ['tests/setup.ts'],
        testTimeout: 10000,
    },
    resolve: {
        alias: {
            '@astermargin/agent-core': agentCoreSrc,
            '@astermargin/agent-ui': agentUiSrc,
            '@astermargin/agent-export': agentExportSrc,
            '@astermargin/agent-local': agentLocalSrc,
        },
    },
});
