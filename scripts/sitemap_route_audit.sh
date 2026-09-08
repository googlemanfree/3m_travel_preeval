#!/usr/bin/env bash
set -u
URLS_FILE="${1:-/tmp/route_sitemap_urls.txt}"
OUT="${2:-/tmp/sitemap_route_audit.tsv}"
: > "$OUT"
export OUT
cat "$URLS_FILE" | xargs -P 12 -n 1 bash -c '
  url="$1"; body=$(mktemp); headers=$(mktemp)
  status=$(curl -L -sS --max-time 20 -D "$headers" -o "$body" -w "%{http_code}" "$url" 2>/dev/null || echo CURL_ERROR)
  title=$(grep -o -i "<title[^>]*>[^<]*" "$body" | head -1 | sed "s/<title[^>]*>//I" | tr "\n" " " | sed "s/[[:space:]]\+/ /g")
  notfound=$(grep -Eio "page introuvable|error 404|not found" "$body" | head -1 | tr "\n" " ")
  printf "%s\t%s\t%s\t%s\n" "$status" "$url" "${title:--}" "${notfound:--}" >> "$OUT"
  rm -f "$body" "$headers"
' _
LC_ALL=C sort -t $'\t' -k1,1 -k2,2 "$OUT"
