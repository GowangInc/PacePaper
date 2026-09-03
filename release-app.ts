import {
  chooseStandalonePort,
  configureReleaseDatabase,
  openTeacherDashboard,
  teacherDashboardUrl,
} from "./src/release-runtime.ts";

// This entrypoint exists solely for the packaged desktop application. Normal
// source development uses `server.ts`, so the packaged data/network behavior
// does not leak into `bun run start` or `bun run dev`.
configureReleaseDatabase();
const { courseSampleSeedSummary, seedCourseSamplePapers } = await import("./src/course-sample-seed.ts");
console.log(courseSampleSeedSummary(seedCourseSamplePapers()));
// Keep a release listening surface ready for a teacher-selected classroom
// address; server-side authority checks keep it loopback-only until then.
process.env.DIGITALDP_MANAGED_NETWORK = "1";
const port = await chooseStandalonePort();

await import("./server.ts");

if (process.env.DIGITALDP_OPEN_BROWSER !== "0") openTeacherDashboard(teacherDashboardUrl(port));
