#!/bin/bash
# PacePaper — macOS double-click launcher (runs from source).
#
# Double-click this file in Finder. It checks for Bun, offers to install it if missing,
# installs npm dependencies on first run, then starts PacePaper and opens your browser.
# Keep the Terminal window open while PacePaper is in use; Control-C stops it.
#
# This file needs the project folder beside it (package.json, server.ts, src/, public/).

set -u
cd "$(dirname "$0")" || exit 1
export PATH="$HOME/.bun/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

pause_then_exit() {
  [ -t 0 ] && { echo; read -r -p "Press Return to close this window. " _; }
  exit "${1:-1}"
}

say() { printf '%s\n' "$1"; }

# --- 1. Bun -----------------------------------------------------------------
if ! command -v bun >/dev/null 2>&1; then
  say ""
  say "PacePaper runs from source with Bun (https://bun.sh), which isn't installed yet."
  say ""
  say "Install it, then double-click this file again:"
  say "    curl -fsSL https://bun.sh/install | bash"
  if [ -t 0 ]; then
    echo
    read -r -p "Install Bun now? [y/N] " answer
    case "$answer" in
      [yY]*)
        say ""
        say "Installing Bun..."
        if ! curl -fsSL https://bun.sh/install | bash; then
          say ""
          say "Bun's installer failed. Check your internet connection, then try again."
          pause_then_exit 1
        fi
        export PATH="$HOME/.bun/bin:$PATH"
        if ! command -v bun >/dev/null 2>&1; then
          say ""
          say "Bun was installed but isn't on the PATH yet. Close this window, open it again, and retry."
          pause_then_exit 1
        fi
        ;;
      *)
        say ""
        say "Nothing was installed. PacePaper needs Bun to start."
        pause_then_exit 1
        ;;
    esac
  else
    pause_then_exit 1
  fi
fi

# --- 2. Gatekeeper quarantine ----------------------------------------------
if command -v xattr >/dev/null 2>&1 && xattr -p com.apple.quarantine "$0" >/dev/null 2>&1; then
  say ""
  say "Note: macOS quarantined this download. If double-clicking does nothing, run this once in Terminal:"
  say "    xattr -d com.apple.quarantine \"$0\""
fi

# --- 3. Dependencies (first run, or after package.json changes) -------------
if [ ! -d node_modules ] || [ package.json -nt node_modules ]; then
  say ""
  say "Installing dependencies (this happens once)..."
  if ! bun install; then
    say ""
    say "Dependency install failed. PacePaper needs an internet connection for this first step."
    pause_then_exit 1
  fi
fi

# --- 4. Start ---------------------------------------------------------------
say ""
say "Starting PacePaper. Keep this window open while the app is in use."
say "Press Control-C here when you want to stop PacePaper."
say ""

exec bun run start:app
