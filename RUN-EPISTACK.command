#!/bin/bash
# FLF Epistemic Stack — Mac double-click launcher.
# This file just hands off to the cross-platform Node runner.

cd "$(dirname "$0")"

# Make sure local Node is on PATH (Homebrew Mac convention).
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

if ! command -v node >/dev/null 2>&1; then
  echo ""
  echo "Node.js was not found on this Mac."
  echo "Install the official .pkg from https://nodejs.org/ (Node 20 or newer),"
  echo "then double-click this file again."
  echo ""
  read -n 1 -s -r -p "Press any key to close."
  exit 1
fi

node scripts/run-epistack.js
