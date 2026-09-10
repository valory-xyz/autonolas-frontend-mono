import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Reads a file from `apps/<app>/public/` during a server render. Both the app dir and the
 * workspace root are tried, since `process.cwd()` differs between a Next and an Nx build.
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
