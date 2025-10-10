import { LifeStage } from 'nutri-core';

export interface ShareConfig {
  secret: string;               // HMAC key for signing
  baseUrl: string;              // e.g., https://app.local/share
  linkTtlSeconds: number;       // default 7 days (604800)
  storage: StorageAdapter;      // pluggable
  clock?: () => Date;           // for tests
}

export interface StorageAdapter {
  put: (key: string, bytes: Uint8Array, meta?: Record<string, string>) => Promise<void>;
  get: (key: string) => Promise<Uint8Array | null>;
  head: (key: string) => Promise<{ size: number; meta: Record<string, string> } | null>;
  del: (key: string) => Promise<void>;
}

export interface ShareLinkInput {
  pdfBytes: Uint8Array;
  stage: LifeStage;
  weekStartISO: string;
  reportMeta: { version: string };
}

export interface ShareLinkResult {
  url: string;
  id: string;
  expiresAtISO: string;
}

export interface TokenValidationResult {
  ok: true;
  id: string;
} | {
  ok: false;
  reason: string;
}

export interface AuditEntry {
  id: string;
  ts: string;
  ipHash: string;
  ua: string;
}

export interface ShareService {
  createLink(input: ShareLinkInput): Promise<ShareLinkResult>;
  validateToken(token: string): TokenValidationResult;
  readPdf(id: string): Promise<Uint8Array | null>;
  logAccess(entry: AuditEntry): Promise<void>;
  listAccess(id: string): Promise<AuditEntry[]>;
}

// Token format: id.base64url(hmacSHA256(id|exp|v, secret)).exp
export interface TokenComponents {
  id: string;
  exp: number;
  v: string;
  signature: string;
}


