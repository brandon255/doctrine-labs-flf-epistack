#!/usr/bin/env bash
# Install a local pre-commit hook that blocks forbidden personal content.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOOK="$ROOT/.git/hooks/pre-commit"
mkdir -p "$ROOT/.git/hooks"
cat > "$HOOK" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
node scripts/check-public-content.js
EOF
chmod +x "$HOOK"
echo "Installed pre-commit hook → $HOOK"
