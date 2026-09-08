from pathlib import Path
import re

catalog = Path("client/src/data/procedures107Complete.ts").read_text(encoding="utf-8")
sources = Path("client/src/data/institutionalProcedureSources.ts").read_text(encoding="utf-8")
procedure_ids = re.findall(r"createCountry\(\s*['\"]([^'\"]+)", catalog)
source_ids = re.findall(r"[\"']procedureId[\"']\s*:\s*[\"']([^\"']+)", sources)
source_urls = re.findall(r"[\"']officialUrl[\"']\s*:\s*[\"'](https://[^\"']+)", sources)
missing_sources = sorted(set(procedure_ids) - set(source_ids))
duplicate_procedures = sorted({item for item in procedure_ids if procedure_ids.count(item) > 1})
duplicate_sources = sorted({item for item in source_ids if source_ids.count(item) > 1})
print(f"procedure_count={len(procedure_ids)}")
print(f"source_count={len(source_ids)}")
print(f"https_source_count={len(source_urls)}")
print(f"missing_source_count={len(missing_sources)}")
print("missing_sources=" + ",".join(missing_sources))
print("duplicate_procedures=" + ",".join(duplicate_procedures))
print("duplicate_sources=" + ",".join(duplicate_sources))
