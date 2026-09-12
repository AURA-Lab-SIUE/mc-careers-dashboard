// src/lib/utils/loadCsv.ts
import Papa from 'papaparse';

/**
 * Load a CSV from /static/data via the Kit‐injected fetch
 */
export async function loadCsv(
  path: string,
  fetchFn: typeof fetch
): Promise<any[]> {
  const res = await fetchFn(path);
  const text = await res.text();
  const { data } = Papa.parse(text, {
    header: true,
    skipEmptyLines: true
  });
  return data;
}
