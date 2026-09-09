import { dataset } from '../_lib/meta';
import classSize from './classSize.json';

/**
 * Alberta average class size, and where the measurement stops.
 *
 * Alberta collected class size data from every school authority for fifteen
 * years and published a provincial average against a guideline. School
 * authorities are no longer required to submit it, so 2018/19 is the last year
 * with a number. The series ending is as much of the story as its level.
 */
export const classSizeMeta = dataset({
  id: 'class-size-by-grade',
  title: "How big are Alberta's classes, against the guideline?",
  unit: 'Students per class, core subjects',
  geography: 'Alberta',
  cadence: 'until 2018/19, then discontinued',
  lastChecked: '2026-09-07',
  nextExpected: null,
  // A row here is a grade cohort and the school years are column names, so
  // there is no period to derive from the series. Alberta school years run
  // September to June, and reporting ran from 2003/04 to 2018/19.
  temporalCoverage: '2003-09/2019-06',
  sources: [
    {
      text: 'Government of Alberta, Alberta Education. 2019 Class Size Initiative Review, Table 3: Class Size Averages, and Table 6: Provincial Comparison of Class Size Guidelines and Actuals.',
      url: 'https://open.alberta.ca/dataset/54122e5d-0c19-4b03-8164-5ff785d6d328/resource/778c78aa-e439-4a32-8b12-adab35a1711f/download/edc-2019-class-size-initiative-review-report.pdf',
      retrieved: '2026-09-07',
    },
    {
      text: 'Government of Alberta. Class size by school year, jurisdiction, and grade, Alberta — the underlying class-level submissions, 2004/05 to 2018/19.',
      url: 'https://open.alberta.ca/opendata/class-size-by-school-year-jurisdiction-and-grade-alberta',
      retrieved: '2026-09-07',
    },
  ],
  notes: [
    'Each bar is the average number of students in a core-subject class in that grade cohort. The guideline is the figure the 2003 Alberta Commission on Learning recommended, which Alberta adopted and funded against for fifteen years.',
    'Kindergarten to Grade 3 is the cohort that moved away from its guideline. It was 19.7 in the first year of the initiative and 20.4 in the last year measured, against a guideline of 17. The other three cohorts ended at or below theirs.',
    'The last figure is for 2018/19. School authorities are no longer required to submit class size data, so there is no provincial average for any year after that, and this chart will not update.',
    'These are averages across the province. A jurisdiction average in the source ranges from under 13 students to over 27 in the same cohort and year, and a provincial average describes none of those classrooms in particular.',
    'Figures are Alberta Education’s own. The published method excludes Colony and Hutterite schools, counts a team-taught class as several classes, and places a combined class such as Grade 3/4 in the higher cohort. Recomputing from the class-level file without those rules gives averages up to 1.5 students different.',
    'The department recorded the submissions as unverified: they are what school authorities reported, and were subject to change.',
  ],
});

export const classSizeData = classSize.series;
