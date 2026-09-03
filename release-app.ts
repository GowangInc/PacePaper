import {
  chooseStandalonePort,
  configureReleaseDatabase,
  openTeacherDashboard,
  teacherDashboardUrl,
} from "./src/release-runtime.ts";

// This entrypoint owns the desktop-style runtime used by both the compiled app
// and the local source launcher. Normal development still uses `server.ts`, so
// packaged data and network behavior do not leak into `bun run dev`.
configureReleaseDatabase();
const { courseSampleSeedSummary, seedCourseSamplePapers } = await import("./src/course-sample-seed.ts");
console.log(courseSampleSeedSummary(seedCourseSamplePapers()));
// Keep a release listening surface ready for a teacher-selected classroom
// address; server-side authority checks keep it loopback-only until then.
process.env.DIGITALDP_MANAGED_NETWORK = "1";
const port = await chooseStandalonePort();

await import("./server.ts");

if (process.env.DIGITALDP_OPEN_BROWSER !== "0") openTeacherDashboard(teacherDashboardUrl(port));
