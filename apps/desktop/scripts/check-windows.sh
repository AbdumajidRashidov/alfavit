#!/usr/bin/env bash
# Type-check the desktop crate for Windows from macOS/Linux — no linking, no
# Windows machine. Tauri's build script wants an RC compiler for the Windows
# target; a check-only stand-in for llvm-rc is created on the fly so you don't
# need a 1.5 GB LLVM install. Real builds happen on the Windows CI runner.
#
# Usage: apps/desktop/scripts/check-windows.sh [extra cargo args]
set -euo pipefail
cd "$(dirname "$0")/../src-tauri"
TARGET=x86_64-pc-windows-msvc
rustup target list --installed | grep -q "^$TARGET$" || rustup target add "$TARGET"

shim_dir="$(mktemp -d)"
trap 'rm -rf "$shim_dir"' EXIT
cat > "$shim_dir/llvm-rc" <<'SHIM'
#!/bin/sh
# Check-only stand-in for llvm-rc: answers embed-resource's probe and creates
# an empty output file. Only valid for `cargo check` (nothing is ever linked).
for a in "$@"; do
  case "$a" in
    "/?") printf 'OVERVIEW: LLVM Resource Converter\n\nOPTIONS:\n  /no-preprocess\n'; exit 0;;
  esac
done
prev=""
for a in "$@"; do
  if [ "$prev" = "/fo" ]; then : > "$a"; fi
  prev="$a"
done
exit 0
SHIM
chmod +x "$shim_dir/llvm-rc"

export RC_x86_64_pc_windows_msvc="$shim_dir/llvm-rc"
export CC_x86_64_pc_windows_msvc=clang
cargo check --target "$TARGET" --tests "$@"
