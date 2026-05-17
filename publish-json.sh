#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [[ ! -f "data/portfolio.json" ]]; then
  echo "Error: data/portfolio.json not found."
  exit 1
fi

CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "main" ]]; then
  echo "Error: publish-json.sh must be run from the local main branch; current branch is '$CURRENT_BRANCH'."
  exit 1
fi

git add "data/portfolio.json"

if git diff --cached --quiet -- "data/portfolio.json"; then
  echo "No changes in data/portfolio.json to commit."
  exit 0
fi

COMMIT_MSG=${1:-'Update Site Content "portfolio"'}

git commit -m "$COMMIT_MSG"
git push origin "$CURRENT_BRANCH"

echo "Done: data/portfolio.json committed and pushed."
