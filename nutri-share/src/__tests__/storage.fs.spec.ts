import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import { FilesystemStorageAdapter, MemoryStorageAdapter } from '../storage'

describe('Filesystem Storage Adapter', () => {
  let tempDir: string
  let storage: FilesystemStorageAdapter

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(__dirname, 'test-storage-'))
    storage = new FilesystemStorageAdapter(tempDir)
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  it('should store and retrieve data', async () => {
    const key = 'test-key'
    const data = new Uint8Array([1, 2, 3, 4, 5])
    const meta = { test: 'metadata' }

    await storage.put(key, data, meta)

    const retrieved = await storage.get(key)
    expect(retrieved).toEqual(data)

    const head = await storage.head(key)
    expect(head).toBeTruthy()
    expect(head!.size).toBe(data.length)
    expect(head!.meta).toEqual(meta)
  })

  it('should return null for non-existent key', async () => {
    const retrieved = await storage.get('non-existent')
    expect(retrieved).toBeNull()

    const head = await storage.head('non-existent')
    expect(head).toBeNull()
  })

  it('should delete data', async () => {
    const key = 'test-delete'
    const data = new Uint8Array([1, 2, 3])

    await storage.put(key, data)
    expect(await storage.get(key)).toEqual(data)

    await storage.del(key)
    expect(await storage.get(key)).toBeNull()
  })

  it('should handle metadata correctly', async () => {
    const key = 'test-meta'
    const data = new Uint8Array([1, 2, 3])
    const meta = { stage: 'pregnancy_trimester2', version: '1.0' }

    await storage.put(key, data, meta)

    const head = await storage.head(key)
    expect(head!.meta).toEqual(meta)
  })
})

describe('Memory Storage Adapter', () => {
  let storage: MemoryStorageAdapter

  beforeEach(() => {
    storage = new MemoryStorageAdapter()
  })

  it('should store and retrieve data', async () => {
    const key = 'test-key'
    const data = new Uint8Array([1, 2, 3, 4, 5])

    await storage.put(key, data)

    const retrieved = await storage.get(key)
    expect(retrieved).toEqual(data)
  })

  it('should return null for non-existent key', async () => {
    const retrieved = await storage.get('non-existent')
    expect(retrieved).toBeNull()
  })

  it('should delete data', async () => {
    const key = 'test-delete'
    const data = new Uint8Array([1, 2, 3])

    await storage.put(key, data)
    expect(await storage.get(key)).toEqual(data)

    await storage.del(key)
    expect(await storage.get(key)).toBeNull()
  })

  it('should clear all data', async () => {
    await storage.put('key1', new Uint8Array([1, 2]))
    await storage.put('key2', new Uint8Array([3, 4]))

    storage.clear()

    expect(await storage.get('key1')).toBeNull()
    expect(await storage.get('key2')).toBeNull()
  })
})


