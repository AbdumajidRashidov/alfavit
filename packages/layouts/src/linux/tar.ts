// A minimal, deterministic .tar.gz: same input, same bytes, on any machine.
// Fixed mtime/uid/gid/mode, and stored (uncompressed) deflate with the OS byte
// pinned — zlib builds differ in both deflate output and the OS byte they
// write, which would trip CI's drift check. The files are a few KB.
import { gzipSync } from 'node:zlib'

const BLOCK = 512

function header(path: string, size: number): Buffer {
  const h = Buffer.alloc(BLOCK)
  const put = (s: string, at: number, len: number) => h.write(s, at, len, 'ascii')
  const octal = (n: number, len: number) => n.toString(8).padStart(len - 1, '0') + '\0'
  put(path, 0, 100)
  put(octal(0o644, 8), 100, 8)
  put(octal(0, 8), 108, 8)
  put(octal(0, 8), 116, 8)
  put(octal(size, 12), 124, 12)
  put(octal(0, 12), 136, 12)
  put('        ', 148, 8) // checksum field counts as spaces while summing
  put('0', 156, 1)
  put('ustar\0', 257, 6)
  put('00', 263, 2)
  const sum = h.reduce((a, b) => a + b, 0)
  put(sum.toString(8).padStart(6, '0') + '\0 ', 148, 8)
  return h
}

export function tarGz(files: { path: string; content: string }[]): Buffer {
  const parts: Buffer[] = []
  for (const { path, content } of files) {
    const body = Buffer.from(content, 'utf8')
    parts.push(header(path, body.length), body, Buffer.alloc((BLOCK - (body.length % BLOCK)) % BLOCK))
  }
  parts.push(Buffer.alloc(BLOCK * 2))
  const gz = gzipSync(Buffer.concat(parts), { level: 0 })
  gz.writeUInt32LE(0, 4) // mtime
  gz[9] = 3 // OS: Unix
  return gz
}
