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

// Course metadata and course-to-occupation ratings used to live in two files
// that disagreed: courses.csv described 39 distinct courses across 53 rows
// (ten of them duplicated once per track), course_job_ratings.csv rated 53,
// and the two were keyed differently, so 14 rated courses carried no title,
// description or tier. They are now one file, courses_merged.csv, with one row
// per course and a multi-valued Counts_For replacing the duplicate rows.
// The page still wants the two shapes, so they are derived here rather than in
// the component.
const META_COLUMNS = [
  'Course_ID', 'Course_Number', 'Title', 'Description', 'Credits', 'Tier',
  'Counts_For', 'Track_Journalism_Pct', 'Track_Production_Pct', 'Track_Strategic_Pct'
];

export const load: PageLoad = async ({ fetch }) => {
  const [
    occupations,
    occupationTechnologies,
    technologies,
    stateWages,
    merged
  ] = await Promise.all([
    loadCsv(`${base}/data/occupations.csv${bust}`, fetch),
    loadCsv(`${base}/data/occupation_technologies.csv${bust}`, fetch),
    loadCsv(`${base}/data/technologies.csv${bust}`, fetch),
    loadCsv(`${base}/data/state_wages.csv${bust}`, fetch),
    loadCsv(`${base}/data/courses_merged.csv${bust}`, fetch)
  ]);

  // Occupation columns are whatever is left once the metadata columns are
  // removed, so adding a career to the CSV needs no change here.
  const occColumns = merged.length
    ? Object.keys(merged[0]).filter((k) => !META_COLUMNS.includes(k) && k !== '')
    : [];

  const courses = merged.map((r: any) => ({
    Course_ID: r.Course_ID,
    Course_Number: r.Course_Number,
    Course_Name: r.Title,
    Description: r.Description,
    Credits: r.Credits,
    Tier: r.Tier,
    // Counts_For is pipe-separated ("journalism|production"), or "all" when the
    // course is core on every track. Required_For is kept as an alias so older
    // reads of the field keep working.
    Counts_For: r.Counts_For,
    Required_For: r.Counts_For,
    Track_Journalism_Pct: r.Track_Journalism_Pct,
    Track_Production_Pct: r.Track_Production_Pct,
    Track_Strategic_Pct: r.Track_Strategic_Pct
  }));

  // A course with no rating in any occupation column is left out of the matrix
  // entirely, so it can never surface as a recommendation on a score of zero.
  const courseJobRatings = merged
    .filter((r: any) => occColumns.some((c) => String(r[c] ?? '').trim() !== ''))
    .map((r: any) => {
      const row: Record<string, string> = {
        Course: `${r.Course_Number} - ${r.Title}`,
        Description: r.Description
      };
      occColumns.forEach((c) => { row[c] = r[c]; });
      return row;
    });

  return {
    occupations,
    occupationTechnologies,
    technologies,
    stateWages,
    courses,
    courseJobRatings
  };
};
