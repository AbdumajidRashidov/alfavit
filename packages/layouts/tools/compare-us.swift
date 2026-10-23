// Checks packages/layouts/out/macos/model.json against the U.S. keyboard layout
// installed on this Mac, key by key and for all 32 combinations of ⌘ ⇧ ⇪ ⌥ ⌃
// (through the model's combination table), so neither a transcription slip in
// the US base nor a wrong modifier mapping reaches the shipped layout.
//
// Read-only: it reads the U.S. layout's data through Text Input Sources and
// translates keystrokes with UCKeyTranslate. It selects, enables and changes
// nothing.
//
//   swift packages/layouts/tools/compare-us.swift packages/layouts/out/macos/model.json
//
// Exit 0 with "0 mismatches", or a list of mismatches and exit 1.
import Carbon
import Foundation

let args = CommandLine.arguments
guard args.count == 2 else { print("usage: compare-us.swift <model.json>"); exit(2) }
let json = try JSONSerialization.jsonObject(with: Data(contentsOf: URL(fileURLWithPath: args[1]))) as! [String: Any]
let keys = json["keys"] as! [String: [String: Any]]
let deadKeys = json["deadKeys"] as! [String: [String: Any]]
let overrides = Set((json["overrides"] as! [[String: Any]]).map { "\($0["keyCode"]!):\($0["state"]!)" })
let combos = (json["combos"] as! [[String: Any]]).map { (bits: UInt32($0["bits"] as! Int), state: $0["state"] as! String) }

let filter = [kTISPropertyInputSourceID as String: "com.apple.keylayout.US"] as CFDictionary
guard let sources = TISCreateInputSourceList(filter, true)?.takeRetainedValue() as? [TISInputSource],
      let us = sources.first,
      let raw = TISGetInputSourceProperty(us, kTISPropertyUnicodeKeyLayoutData) else {
  print("could not read com.apple.keylayout.US"); exit(2)
}
let layoutData = Unmanaged<CFData>.fromOpaque(raw).takeUnretainedValue() as Data
let keyboardType = UInt32(LMGetKbdType())

// UCKeyTranslate modifier state = (Carbon modifier mask >> 8) & 0xFF:
// command 1, shift 2, caps 4, option 8, control 16 — the model's combo bits.
let modsOf: [String: UInt32] = ["plain": 0, "shift": 2, "option": 8]
func comboName(_ b: UInt32) -> String {
  let n = [b & 1 != 0 ? "⌘" : "", b & 2 != 0 ? "⇧" : "", b & 4 != 0 ? "⇪" : "", b & 8 != 0 ? "⌥" : "", b & 16 != 0 ? "⌃" : ""].joined()
  return n.isEmpty ? "none" : n
}

func translate(_ code: UInt16, _ mods: UInt32, _ dead: inout UInt32) -> String {
  layoutData.withUnsafeBytes { buf -> String in
    let layout = buf.baseAddress!.assumingMemoryBound(to: UCKeyboardLayout.self)
    var length = 0
    var chars = [UniChar](repeating: 0, count: 8)
    let status = UCKeyTranslate(layout, code, UInt16(kUCKeyActionDown), mods, keyboardType, 0, &dead, 8, &length, &chars)
    return status == noErr ? String(utf16CodeUnits: chars, count: length) : "<error \(status)>"
  }
}

func show(_ s: String) -> String {
  s.isEmpty ? "(nothing)" : s.unicodeScalars.map { String(format: "U+%04X", $0.value) }.joined(separator: " ")
}

var mismatches: [String] = []
func mismatch(_ line: String) { mismatches.append(line) }

// 1. Every key code, under every one of the 32 modifier combinations.
if combos.count != 32 { mismatch("combination table has \(combos.count) entries, want 32") }
for (mods, state) in combos {
  let label = "\(comboName(mods))→\(state)"
  for code in 0...127 {
    if overrides.contains("\(code):\(state)") { continue }
    var dead: UInt32 = 0
    let actual = translate(UInt16(code), mods, &dead)
    switch keys[String(code)]?[state] {
    case nil:
      if !actual.isEmpty || dead != 0 { mismatch("\(code) \(label) model=(missing) apple=\(dead != 0 ? "dead key" : show(actual))") }
    case let expected as String:
      if dead != 0 || actual != expected { mismatch("\(code) \(label) model=\(show(expected)) apple=\(dead != 0 ? "dead key" : show(actual))") }
    case let expected as [String: Any]:
      if dead == 0 || !actual.isEmpty { mismatch("\(code) \(label) model=dead \(expected["dead"]!) apple=\(show(actual))") }
    default:
      mismatch("\(code) \(label) model=unreadable")
    }
  }
}

// 2. Every dead key, followed by every letter and by space.
var keyFor: [String: (code: UInt16, mods: UInt32)] = [:]
for (codeStr, byState) in keys {
  for state in ["plain", "shift"] {
    if let ch = byState[state] as? String, ch.count == 1, keyFor[ch] == nil { keyFor[ch] = (UInt16(codeStr)!, modsOf[state]!) }
  }
}
let bases = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ ".map(String.init)
for (id, spec) in deadKeys.sorted(by: { $0.key < $1.key }) {
  let terminator = spec["terminator"] as! String
  let compose = spec["compose"] as! [String: String]
  guard let trigger = keys.first(where: { ($0.value["option"] as? [String: Any])?["dead"] as? String == id }) else {
    mismatch("dead \(id): no trigger key in model"); continue
  }
  for base in bases {
    guard let key = keyFor[base] else { mismatch("dead \(id): no key types \(show(base))"); continue }
    var dead: UInt32 = 0
    _ = translate(UInt16(trigger.key)!, modsOf["option"]!, &dead)
    let actual = translate(key.code, key.mods, &dead)
    let expected = base == " " ? terminator : (compose[base] ?? terminator + base)
    if actual != expected { mismatch("dead \(id) then \(show(base)) model=\(show(expected)) apple=\(show(actual))") }
  }
}

mismatches.forEach { print($0) }
print("\(mismatches.count) mismatches")
exit(mismatches.isEmpty ? 0 : 1)
