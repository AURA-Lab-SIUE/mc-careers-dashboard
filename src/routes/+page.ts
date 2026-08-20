// src/routes/+page.ts
import type { PageLoad } from './$types';
import { loadCsv }    from '$lib/utils/loadCsv';
import { base }       from '$app/paths';
import { browser, version } from '$app/environment';

// Data CSVs are fetched by a stable path, so a returning browser serves them
// from cache after a redeploy: the content-hashed JS updates but the data does
// not, leaving users on a stale occupation/wage set. Append the build version
// on the client so every deploy fetches fresh data. During prerender
// (browser === false) the query is omitted so the static file resolves on disk.
const bust = browser ? `?v=${version}` : '';

export const load: PageLoad = async ({ fetch }) => {
  const [
    occupations,
    occupationTechnologies,
    technologies,
    stateWages,
    courses,
    courseJobRatings
  ] = await Promise.all([
    loadCsv(`${base}/data/occupations.csv${bust}`, fetch),
    loadCsv(`${base}/data/occupation_technologies.csv${bust}`, fetch),
    loadCsv(`${base}/data/technologies.csv${bust}`, fetch),
    loadCsv(`${base}/data/state_wages.csv${bust}`, fetch),
    loadCsv(`${base}/data/courses.csv${bust}`, fetch),
    loadCsv(`${base}/data/course_job_ratings.csv${bust}`, fetch)
  ]);

  return {
    occupations,
    occupationTechnologies,
    technologies,
    stateWages,
    courses,
    courseJobRatings
  };
};
