#!/usr/bin/env bash
# Downloads every FEMA firefighter-grant PDF listed in urls.txt into ./pdfs/.
# Run this from a normal network: fema.gov blocks datacenter/proxy IPs (403),
# so it will NOT work from the app's build/CI environment.
#
# Usage:  bash download.sh
set -u

DIR="$(cd "$(dirname "$0")" && pwd)"
OUT="$DIR/pdfs"
mkdir -p "$OUT"
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36"

ok=0; fail=0
while IFS= read -r url; do
  # skip blanks and comment lines
  [[ -z "$url" || "$url" == \#* ]] && continue
  name="$(basename "${url%%\?*}")"
  echo "-> $name"
  if curl -fsSL -A "$UA" -o "$OUT/$name" "$url"; then
    ok=$((ok+1))
  else
    echo "   FAILED: $url"
    fail=$((fail+1))
  fi
done < "$DIR/urls.txt"

echo ""
echo "Done. Saved $ok file(s) to $OUT; $fail failed."
