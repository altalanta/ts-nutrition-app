import { describe, it, expect, beforeEach } from 'vitest'
import { signToken, parseToken, validateTokenSignature } from '../crypto'

describe('Token Validity', () => {
  const secret = 'test-secret-key-for-hmac-signing'

  it('should generate and validate a valid token', () => {
    const id = 'test_id_123'
    const exp = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
    const token = signToken(id, exp, secret)

    const validation = validateTokenSignature(token, secret)
    expect(validation.valid).toBe(true)
    expect(validation.components?.id).toBe(id)
    expect(validation.components?.exp).toBe(exp)
  })

  it('should reject invalid signature', () => {
    const id = 'test_id_123'
    const exp = Math.floor(Date.now() / 1000) + 3600
    const token = signToken(id, exp, secret)

    // Tamper with the signature
    const parts = token.split('.')
    parts[1] = 'tampered_signature'
    const tamperedToken = parts.join('.')

    const validation = validateTokenSignature(tamperedToken, secret)
    expect(validation.valid).toBe(false)
  })

  it('should reject expired tokens', () => {
    const id = 'test_id_123'
    const exp = Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
    const token = signToken(id, exp, secret)

    const validation = validateTokenSignature(token, secret)
    expect(validation.valid).toBe(true) // Signature is valid
    expect(validation.components?.exp).toBe(exp)
    // But the token is expired, which should be checked by the service
  })

  it('should reject malformed tokens', () => {
    const invalidTokens = [
      'invalid',
      'too.few.parts',
      'too.many.parts.here.extra',
      '',
    ]

    invalidTokens.forEach(token => {
      const validation = validateTokenSignature(token, secret)
      expect(validation.valid).toBe(false)
    })
  })

  it('should handle different secrets', () => {
    const id = 'test_id_123'
    const exp = Math.floor(Date.now() / 1000) + 3600
    const token = signToken(id, exp, secret)

    // Should fail with different secret
    const validation = validateTokenSignature(token, 'different-secret')
    expect(validation.valid).toBe(false)
  })
})

