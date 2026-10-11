#!/usr/bin/env bash
set -euo pipefail
repo_root=$(git rev-parse --show-toplevel)
cd "$repo_root"
test -f dist/index.html
test -f dist/src/data.js
test -f dist/assets/campaign-portraits.png
test -f dist/src/campaign.js
git fetch origin gh-pages
pages_parent=$(git rev-parse FETCH_HEAD)
pages_index=$(mktemp /tmp/lineage-pages-index.XXXXXX)
trap 'rm -f "$pages_index"' EXIT
export GIT_INDEX_FILE="$pages_index"
git read-tree --empty
git --work-tree="$repo_root/dist" add --all
pages_tree=$(git write-tree)
pages_commit=$(printf '%s\n' 'Publish Lineage 0.4 procedural campaigns and court audiences' | git -c user.name='Lineage deployment' -c user.email='deployment@users.noreply.github.com' commit-tree "$pages_tree" -p "$pages_parent")
git push origin "$pages_commit:refs/heads/gh-pages"
