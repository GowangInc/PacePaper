import { courseSampleSeedSummary, seedCourseSamplePapers } from "../src/course-sample-seed.ts";
import { COURSE_SAMPLE_PAPERS } from "./sample-source/index.ts";

console.log(courseSampleSeedSummary(seedCourseSamplePapers(COURSE_SAMPLE_PAPERS)));
