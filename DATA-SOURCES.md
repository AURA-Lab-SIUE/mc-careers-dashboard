# Data sources

The CSV files in `static/data/` (and their copies in `docs/data/`) were compiled for this dashboard. The repository did not record the source release of each file; the entries below are identified from the files' column names and codes.

| File | Contents | Source |
|---|---|---|
| `occupations.csv` | Occupation codes and titles, alternate titles, descriptions, and tracks | Codes follow the Standard Occupational Classification (SOC); the source of the alternate titles and descriptions was not recorded. |
| `state_wages.csv` | Median annual wage by state (`AREA_TITLE`, `A_MEDIAN`) | U.S. Bureau of Labor Statistics, Occupational Employment and Wage Statistics (OEWS) state estimates; release year not recorded. U.S. government work, public domain. |
| `technologies.csv`, `occupation_technologies.csv` | Technology categories (`Commodity Title`) and examples linked to occupations | O*NET Technology Skills, O*NET Database by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA), used under the CC BY 4.0 license; version not recorded. O*NET is a trademark of USDOL/ETA. This dashboard has modified all or some of this information; USDOL/ETA has not approved, endorsed, or tested these modifications. |
| `courses_merged.csv` | SIUE Mass Communications courses, descriptions, tracks, and per-occupation relevance weights | Compiled for this dashboard; the sources were not recorded. |

The MIT License in `LICENSE` covers the dashboard's code, not these data.
