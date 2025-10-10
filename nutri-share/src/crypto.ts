import crypto from 'crypto';

/**
 * Generate HMAC-SHA256 signature
 */
export function hmacSha256(data: string, secret: string): Buffer {
  return crypto.createHmac('sha256', secret).update(data).digest();
}

/**
 * Generate base64url-encoded string
 */
export function base64urlEncode(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Decode base64url string
 */
export function base64urlDecode(str: string): Buffer {
  // Add padding if needed
  const padded = str + '='.repeat((4 - (str.length % 4)) % 4);
  return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

/**
 * Hash IP address using the same secret as HMAC
 */
export function hashIP(ip: string, secret: string): string {
  return hmacSha256(ip, secret).toString('hex');
}

/**
 * Generate a random ID in base36 format
 */
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `share_${timestamp}_${random}`;
}

/**
 * Create token components for signing
 */
export function createTokenComponents(
  id: string,
  exp: number,
  version: string = 'v1'
): string {
  return `${id}|${exp}|${version}`;
}

/**
 * Generate signed token
 */
export function signToken(
  id: string,
  exp: number,
  secret: string,
  version: string = 'v1'
): string {
  const components = createTokenComponents(id, exp, version);
  const signature = hmacSha256(components, secret);
  const signatureB64 = base64urlEncode(signature);

  return `${id}.${signatureB64}.${exp}`;
}

/**
 * Parse and validate token
 */
export function parseToken(token: string): TokenComponents | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [id, signatureB64, expStr] = parts;
  const exp = parseInt(expStr, 10);
  const signature = base64urlDecode(signatureB64);

  return {
    id,
    exp,
    v: 'v1', // Default version
    signature: signatureB64,
  };
}

/**
 * Validate token signature
 */
export function validateTokenSignature(
  token: string,
  secret: string
): { valid: boolean; components?: TokenComponents } {
  const components = parseToken(token);
  if (!components) return { valid: false };

  const expectedSignature = signToken(components.id, components.exp, secret, components.v);
  const expectedComponents = parseToken(expectedSignature);

  if (!expectedComponents) return { valid: false };

  return {
    valid: components.signature === expectedComponents.signature,
    components,
  };
}


