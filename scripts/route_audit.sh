#!/usr/bin/env bash
set -u
BASE="${1:-https://www.3mtravelagency.com}"
ROUTES=(
  "/" "/procedures" "/ressources" "/guide-procedures" "/evisas" "/3m-digital" "/formation" "/canada" "/evaluation-primaire" "/evaluation-rapide-enhanced" "/login" "/signup" "/mon-espace?section=dossier" "/mon-dossier" "/document-upload" "/mes-vols-favoris" "/flights" "/tourisme" "/assurance" "/traduction/order" "/hotels" "/visa-etudes" "/etat-du-service" "/admin" "/admin/digital-services" "/robots.txt" "/sitemap.xml" "/api/og"
)
for route in "${ROUTES[@]}"; do
  body=$(mktemp)
  headers=$(mktemp)
  status=$(curl -L -sS --max-time 20 -D "$headers" -o "$body" -w '%{http_code}' "$BASE$route" 2>/dev/null || echo "CURL_ERROR")
  final=$(awk 'tolower($1)=="location:" {gsub("\r", "", $2); value=$2} END {print value}' "$headers")
  title=$(grep -o -i '<title[^>]*>[^<]*' "$body" | head -1 | sed 's/<title[^>]*>//I' | tr '\n' ' ')
  notfound=$(grep -Eio 'page introuvable|error 404|not found' "$body" | head -1 | tr '\n' ' ')
  printf '%s\t%s\t%s\t%s\t%s\n' "$status" "$route" "${final:--}" "${title:--}" "${notfound:--}"
  rm -f "$body" "$headers"
done
