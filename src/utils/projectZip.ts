import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

const IGNORED_DIRS = new Set([
  'node_modules',
  'dist',
  '.git',
  '.playwright-cli',
  '.aistudio',
  '.venv',
  'venv',
  '__pycache__',
  'public',
]);

const IGNORED_FILES = new Set([
  '.env',
  '.env.local',
  '.env.production',
  '.DS_Store',
  'package-lock.json',
  'bun.lock',
  'metadata.json',
]);

export function listProjectFiles(rootDir: string): string[] {
  const results: string[] = [];

  function walk(currentDir: string, relPrefix: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const name = entry.name;
      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(name) || name.startsWith('.')) {
          continue;
        }
        walk(path.join(currentDir, name), relPrefix ? `${relPrefix}/${name}` : name);
      } else if (entry.isFile()) {
        if (IGNORED_FILES.has(name) || name.endsWith('.log')) {
          continue;
        }
        // Keep .env.example and .gitignore, skip other dotfiles
        if (name.startsWith('.') && name !== '.env.example' && name !== '.gitignore') {
          continue;
        }
        results.push(relPrefix ? `${relPrefix}/${name}` : name);
      }
    }
  }

  walk(rootDir, '');
  return results.sort((a, b) => a.localeCompare(b));
}

export async function buildProjectZipBuffer(rootDir: string): Promise<Buffer> {
  const zip = new JSZip();
  const folder = zip.folder('mindmate-project');
  if (!folder) {
    throw new Error('Could not initialize zip archive folder.');
  }

  const files = listProjectFiles(rootDir);
  for (const relPath of files) {
    const absPath = path.join(rootDir, relPath);
    const content = fs.readFileSync(absPath);
    folder.file(relPath, content);
  }

  return zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}
