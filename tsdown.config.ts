/**
 * Build faces for dsh-talk. The node half (src/index.ts + the hand-written
 * Typert host manifest src/typert.host.ts) is the host Loader entry; the
 * browser half (src/client/index.ts) is the client bundle the client-modules
 * node half serves under /plugins/dsh-talk/client.js.
 *
 * The browser half follows the shell's client-bundle handshake exactly: a
 * CJS bundle wrapped in `window.__ModuleLoader__.load({ id, factory })`,
 * with the shell's platform modules left external and every other dependency
 * inlined. zod is inlined into both halves; it stays a declared dependency
 * for the node face's type surface.
 */

import { defineConfig } from 'tsdown'

/** Plugin id: the cordis.yml bare row name, the graph row id, and the stamped bundle id must all match. */
const PLUGIN_ID = 'dsh-talk'

/** Module specifiers the shell shares into the frozen browser module table. */
const PLATFORM_EXTERNALS: readonly string[] = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-web-react',
  '@deepseek-ai/dsh-client-runtime/client',
]

export default defineConfig([
  {
    name: PLUGIN_ID,
    entry: { index: 'src/index.ts', 'typert.host': 'src/typert.host.ts' },
    outDir: 'lib',
    format: ['esm'],
    platform: 'node',
    target: 'es2024',
    dts: false,
    clean: false,
    fixedExtension: false,
    deps: {
      // Only zod may come in from node_modules; everything else stays external.
      onlyBundle: ['zod'],
      alwaysBundle: ['zod'],
      neverBundle: [/^node:/],
    },
  },
  {
    name: `${PLUGIN_ID}/client`,
    entry: { client: 'src/client/index.ts' },
    outDir: 'lib',
    format: ['cjs'],
    platform: 'browser',
    dts: false,
    sourcemap: true,
    clean: false,
    deps: {
      onlyBundle: false,
      alwaysBundle: (id: string) => (PLATFORM_EXTERNALS.includes(id) ? undefined : true),
      neverBundle: [...PLATFORM_EXTERNALS],
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
      'import.meta.env.MODE': JSON.stringify(process.env.NODE_ENV ?? 'production'),
      'import.meta.env': JSON.stringify({ MODE: process.env.NODE_ENV ?? 'production' }),
    },
    outputOptions: {
      entryFileNames: 'client.js',
      banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(PLUGIN_ID)}, factory: (require) => {`,
      footer: 'return module.exports; } });',
      intro: 'var module = { exports: {} }; var exports = module.exports;',
    },
  },
])
