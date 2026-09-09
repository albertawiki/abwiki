/**
 * Let a build script import the app's own data modules.
 *
 * The alternative is a second copy of every dataset's metadata written out for
 * Node to read, and a second copy is a copy that drifts. This site's whole
 * claim is that the number on the chart, the number in the data table and the
 * number in the citation are the same number; a build step that reads its own
 * transcription of the sources would quietly break that.
 *
 * Two things stop Node importing `src/data/index.js` as it stands, and neither
 * is about the code being unsuitable — the data layer is plain ESM with no
 * React, no CSS and no browser globals. They are both bundler conventions that
 * Node does not share:
 *
 *   - `import { dataset } from '../_lib/meta'` has no extension. Node requires
 *     one; webpack resolves it.
 *   - `import rows from './wages.json'` has no import attribute. Node requires
 *     `with { type: 'json' }`; webpack does not.
 *   - `.js` in a package with no `"type": "module"` is CommonJS to Node, and
 *     these files are modules.
 *
 * Rewriting the app to suit a build script would be the tail wagging the dog,
 * so the script adapts instead. Scope is deliberately narrow: only files under
 * `src/` are touched, so nothing here changes how a dependency loads.
 *
 * Usage, before any import of an app module:
 *
 *   import { register } from 'node:module';
 *   register('./lib/app-modules.mjs', import.meta.url);
 *   const { datasets } = await import('../src/data/index.js');
 */

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const SRC = pathToFileURL(join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', '/')).href;

const ours = (url) => url.startsWith(SRC);

/** Add the extension webpack would have added. */
export async function resolve(specifier, context, next) {
  if (specifier.startsWith('.') && context.parentURL && ours(context.parentURL)) {
    const url = new URL(specifier, context.parentURL);
    if (!/\.[a-z]+$/.test(url.pathname)) {
      for (const ext of ['.js', '.mjs', '/index.js']) {
        const candidate = new URL(specifier + ext, context.parentURL);
        if (existsSync(fileURLToPath(candidate))) {
          return next(specifier + ext, context);
        }
      }
    }
  }
  return next(specifier, context);
}

/**
 * Load our `.js` as ESM and our `.json` as a default-exported module.
 *
 * The JSON is re-emitted as source rather than passed through Node's own JSON
 * module, because that path insists on the import attribute the app does not
 * write. `JSON.parse` first, so a malformed data file fails here with its own
 * name attached rather than as a syntax error in generated source.
 */
export async function load(url, context, next) {
  if (!ours(url)) return next(url, context);

  if (url.endsWith('.json')) {
    const parsed = JSON.parse(readFileSync(fileURLToPath(url), 'utf8'));
    return {
      format: 'module',
      shortCircuit: true,
      source: `export default ${JSON.stringify(parsed)};`,
    };
  }

  if (url.endsWith('.js')) {
    return next(url, { ...context, format: 'module' });
  }

  return next(url, context);
}
