import fs from 'fs';
import path from 'path';
import { StorageAdapter } from './types';

/**
 * Filesystem storage adapter
 */
export class FilesystemStorageAdapter implements StorageAdapter {
  private baseDir: string;

  constructor(baseDir: string = '.share') {
    this.baseDir = baseDir;
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    const objectsDir = path.join(this.baseDir, 'objects');
    const auditDir = path.join(this.baseDir, 'audit');

    if (!fs.existsSync(objectsDir)) {
      fs.mkdirSync(objectsDir, { recursive: true });
    }
    if (!fs.existsSync(auditDir)) {
      fs.mkdirSync(auditDir, { recursive: true });
    }
  }

  async put(key: string, bytes: Uint8Array, meta?: Record<string, string>): Promise<void> {
    const objectsDir = path.join(this.baseDir, 'objects');
    const filePath = path.join(objectsDir, `${key}.pdf`);

    // Write PDF bytes
    await fs.promises.writeFile(filePath, bytes);

    // Write metadata if provided
    if (meta && Object.keys(meta).length > 0) {
      const metaPath = path.join(objectsDir, `${key}.meta.json`);
      await fs.promises.writeFile(metaPath, JSON.stringify(meta, null, 2));
    }
  }

  async get(key: string): Promise<Uint8Array | null> {
    const objectsDir = path.join(this.baseDir, 'objects');
    const filePath = path.join(objectsDir, `${key}.pdf`);

    try {
      const buffer = await fs.promises.readFile(filePath);
      return new Uint8Array(buffer);
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async head(key: string): Promise<{ size: number; meta: Record<string, string> } | null> {
    const objectsDir = path.join(this.baseDir, 'objects');
    const filePath = path.join(objectsDir, `${key}.pdf`);
    const metaPath = path.join(objectsDir, `${key}.meta.json`);

    try {
      const stats = await fs.promises.stat(filePath);
      const size = stats.size;

      let meta: Record<string, string> = {};
      try {
        const metaContent = await fs.promises.readFile(metaPath, 'utf8');
        meta = JSON.parse(metaContent);
      } catch {
        // No metadata file, return empty meta
      }

      return { size, meta };
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async del(key: string): Promise<void> {
    const objectsDir = path.join(this.baseDir, 'objects');
    const filePath = path.join(objectsDir, `${key}.pdf`);
    const metaPath = path.join(objectsDir, `${key}.meta.json`);

    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      if ((error as any).code !== 'ENOENT') {
        throw error;
      }
    }

    try {
      await fs.promises.unlink(metaPath);
    } catch (error) {
      if ((error as any).code !== 'ENOENT') {
        throw error;
      }
    }
  }
}

/**
 * In-memory storage adapter for testing
 */
export class MemoryStorageAdapter implements StorageAdapter {
  private objects = new Map<string, Uint8Array>();
  private meta = new Map<string, Record<string, string>>();

  async put(key: string, bytes: Uint8Array, meta?: Record<string, string>): Promise<void> {
    this.objects.set(key, bytes);
    if (meta) {
      this.meta.set(key, meta);
    }
  }

  async get(key: string): Promise<Uint8Array | null> {
    return this.objects.get(key) || null;
  }

  async head(key: string): Promise<{ size: number; meta: Record<string, string> } | null> {
    const bytes = this.objects.get(key);
    if (!bytes) return null;

    const meta = this.meta.get(key) || {};
    return { size: bytes.length, meta };
  }

  async del(key: string): Promise<void> {
    this.objects.delete(key);
    this.meta.delete(key);
  }

  // Testing helper
  clear(): void {
    this.objects.clear();
    this.meta.clear();
  }
}


