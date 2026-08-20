#!/usr/bin/env bash
set -u
while IFS='|' read -r city bbox; do
  body=$(curl --silent --show-error --max-time 25 --data-urlencode "data=[out:json][timeout:20];nwr[\"tourism\"=\"hotel\"](${bbox});out center tags;" https://overpass.kumi.systems/api/interpreter 2>&1)
  status=$?
  if [ "$status" -ne 0 ]; then
    printf '%s: source temporairement indisponible\n' "$city"
  else
    count=$(printf '%s' "$body" | grep -E '"name"[[:space:]]*:' | wc -l | tr -d ' ')
    printf '%s: %s hôtels nommés\n' "$city" "$count"
  fi
done <<'CITIES'
Douala|4.000,9.550,4.150,9.850
Yaoundé|3.750,11.400,3.980,11.650
Kribi|2.850,9.860,2.990,9.970
Limbe|4.000,9.150,4.080,4.080,9.280
Libreville|0.310,9.350,0.550,9.570
Brazzaville|-4.360,15.150,-4.150,15.360
N'Djamena|12.000,15.000,12.200,15.200
Malabo|3.700,8.690,3.820,8.860
Bangui|4.280,18.480,4.480,18.700
CITIES
