import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Reads a file from an app's `public/` directory during a server render.
 *
 * Several pages kept their prose as markdown in `public/` and fetched it from the browser, which
 * left the served HTML holding a shell — the same shell for every id on a dynamic route. Reading
 * the file here puts the prose in the HTML instead.
 *
 * Next resolves `process.cwd()` to the app directory, but an Nx build can run from the workspace
 * root, so both are tried rather than assuming one.
 *
 * @param app  Directory name under `apps/`, e.g. `launch`.
 * @param relativePath  Path within that app's `public/`, e.g. `paths-markdown/my-path.md`.
 */
export async function readPublicFile(app: string, relativePath: string): Promise<string> {
  const candidates = [
    join(process.cwd(), 'public', relativePath),
    join(process.cwd(), 'apps', app, 'public', relativePath),
  ];

  const failures: string[] = [];
  for (const candidate of candidates) {
    try {
      return await readFile(candidate, 'utf8');
    } catch (error) {
      failures.push(`${candidate}: ${(error as Error).message}`);
    }
  }

  // Throwing fails the build, which is the point: shipping the page without its content is the
  // bug this exists to prevent, and it would be invisible in a browser, which fetches it anyway.
  throw new Error(`Could not read public/${relativePath} for ${app}.\n${failures.join('\n')}`);
}
