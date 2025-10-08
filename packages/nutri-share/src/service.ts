import { ShareConfig, ShareService, ShareLinkInput, ShareLinkResult, TokenValidationResult, AuditEntry } from './types';
import { signToken, validateTokenSignature, generateId } from './crypto';
import { hashIP } from './crypto';

/**
 * Create a share service instance
 */
export function createShareService(config: ShareConfig): ShareService {
  const clock = config.clock || (() => new Date());

  return {
    async createLink(input: ShareLinkInput): Promise<ShareLinkResult> {
      const id = generateId();
      const now = clock();
      const exp = Math.floor((now.getTime() + config.linkTtlSeconds * 1000) / 1000);

      // Store PDF
      await config.storage.put(id, input.pdfBytes, {
        stage: input.stage,
        weekStartISO: input.weekStartISO,
        version: input.reportMeta.version,
        createdAt: now.toISOString(),
      });

      // Generate signed token
      const token = signToken(id, exp, config.secret);

      // Build URL
      const url = `${config.baseUrl}/${token}`;

      return {
        url,
        id,
        expiresAtISO: new Date(exp * 1000).toISOString(),
      };
    },

    validateToken(token: string): TokenValidationResult {
      const validation = validateTokenSignature(token, config.secret);

      if (!validation.valid || !validation.components) {
        return { ok: false, reason: 'Invalid signature' };
      }

      const { id, exp } = validation.components;
      const now = Math.floor(clock().getTime() / 1000);

      if (now > exp) {
        return { ok: false, reason: 'Token expired' };
      }

      return { ok: true, id };
    },

    async readPdf(id: string): Promise<Uint8Array | null> {
      return await config.storage.get(id);
    },

    async logAccess(entry: AuditEntry): Promise<void> {
      const fs = await import('fs');
      const auditDir = '.share/audit';
      const auditPath = `${auditDir}/${entry.id}.jsonl`;

      // Ensure audit directory exists
      if (!fs.existsSync(auditDir)) {
        fs.mkdirSync(auditDir, { recursive: true });
      }

      // Append audit entry
      const line = JSON.stringify(entry) + '\n';
      await fs.promises.appendFile(auditPath, line);
    },

    async listAccess(id: string): Promise<AuditEntry[]> {
      const fs = await import('fs');
      const auditDir = '.share/audit';
      const auditPath = `${auditDir}/${id}.jsonl`;

      try {
        const content = await fs.promises.readFile(auditPath, 'utf8');
        return content.trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
      } catch (error) {
        if ((error as any).code === 'ENOENT') {
          return [];
        }
        throw error;
      }
    },
  };
}

/**
 * Create share service with filesystem storage (for development)
 */
export function createFilesystemShareService(
  secret: string,
  baseUrl: string = 'http://localhost:3000/share',
  linkTtlSeconds: number = 7 * 24 * 60 * 60 // 7 days
): ShareService {
  const { FilesystemStorageAdapter } = require('./storage');
  const storage = new FilesystemStorageAdapter();

  return createShareService({
    secret,
    baseUrl,
    linkTtlSeconds,
    storage,
  });
}
