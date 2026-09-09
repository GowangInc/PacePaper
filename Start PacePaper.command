#!/bin/zsh

set -u

cd -- "${0:A:h}" || exit 1
export PATH="${HOME}/.bun/bin:/opt/homebrew/bin:/usr/local/bin:${PATH}"

if ! command -v bun >/dev/null 2>&1; then
  echo "PacePaper needs Bun to run from source. Install Bun, then open this file again."
  echo "https://bun.sh/"
  echo
  read -r "?Press Return to close this window."
  exit 1
fi

echo "Starting PacePaper from source. Keep this window open while the app is in use."
echo "Press Control-C here when you want to stop PacePaper."
echo

exec bun run start:app
