// A minimal, deterministic .zip: same input, same bytes, on any machine.
// Stored (uncompressed) entries, a fixed 1980-01-01 timestamp, and Unix modes
// so ditto, Archive Utility and unzip all restore folders as 755 and files as
// 644. Folders get their own entries, which Finder needs to see a bundle.

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

/** CRC-32 as zip and PNG use it. zlib.crc32 would do, but needs Node 22. */
export function crc32(data: Uint8Array): number {
  let c = 0xffffffff
  for (const byte of data) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

const DOS_DATE = (0 << 9) | (1 << 5) | 1 // 1980-01-01, the earliest a zip can say

/** Files by path; every parent folder is added as an entry before its contents. */
export function zip(files: { path: string; content: string | Buffer }[]): Buffer {
  const entries: { name: string; data: Buffer; mode: number }[] = []
  const seen = new Set<string>()
  for (const { path, content } of files) {
    const parts = path.split('/')
    for (let i = 1; i < parts.length; i++) {
      const dir = parts.slice(0, i).join('/') + '/'
      if (!seen.has(dir)) { seen.add(dir); entries.push({ name: dir, data: Buffer.alloc(0), mode: 0o40755 }) }
    }
    entries.push({ name: path, data: Buffer.from(content), mode: 0o100644 })
  }

  const locals: Buffer[] = [], centrals: Buffer[] = []
  let offset = 0
  for (const { name, data, mode } of entries) {
    const nameBytes = Buffer.from(name, 'utf8')
    const crc = crc32(data)
    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(10, 4) // version needed: 1.0, stored
    local.writeUInt16LE(0, 6) // flags
    local.writeUInt16LE(0, 8) // method: stored
    local.writeUInt16LE(0, 10) // time 00:00:00
    local.writeUInt16LE(DOS_DATE, 12)
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(data.length, 18)
    local.writeUInt32LE(data.length, 22)
    local.writeUInt16LE(nameBytes.length, 26)
    local.writeUInt16LE(0, 28)
    locals.push(local, nameBytes, data)

    const central = Buffer.alloc(46)
    central.writeUInt32LE(0x02014b50, 0)
    central.writeUInt16LE((3 << 8) | 20, 4) // made by: Unix, 2.0 — so the modes below are read
    local.copy(central, 6, 4, 30) // version needed … name length, as in the local header
    central.writeUInt16LE(0, 32) // comment length
    central.writeUInt16LE(0, 34) // disk
    central.writeUInt16LE(0, 36) // internal attributes
    central.writeUInt32LE(((mode << 16) | (name.endsWith('/') ? 0x10 : 0)) >>> 0, 38)
    central.writeUInt32LE(offset, 42)
    centrals.push(central, nameBytes)
    offset += 30 + nameBytes.length + data.length
  }

  const directory = Buffer.concat(centrals)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(entries.length, 8)
  end.writeUInt16LE(entries.length, 10)
  end.writeUInt32LE(directory.length, 12)
  end.writeUInt32LE(offset, 16)
  return Buffer.concat([...locals, directory, end])
}
