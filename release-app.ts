import {
  chooseStandalonePort,
  configureReleaseDatabase,
  openTeacherDashboard,
  teacherDashboardUrl,
} from "./src/release-runtime.ts";
import { RELEASE_SAMPLE_PAPER } from "./examples/release-sample.ts";

// This entrypoint owns the desktop-style runtime used by both the compiled app
// and the local source launcher. Normal development still uses `server.ts`, so
// packaged data and network behavior do not leak into `bun run dev`.
configureReleaseDatabase();
// Dynamic: course-sample-seed imports db.ts at module load and must open the
// release database that configureReleaseDatabase() just selected, not the default.
const { courseSampleSeedSummary, seedCourseSamplePapers } = await import("./src/course-sample-seed.ts");
// Releases bundle one IB example exam only — the English B Paper 2 reading paper —
// embedded as a standalone JSON asset, not the full development sample set.
console.log(courseSampleSeedSummary(seedCourseSamplePapers([RELEASE_SAMPLE_PAPER])));
// Keep a release listening surface ready for a teacher-selected classroom
// address; server-side authority checks keep it loopback-only until then.
process.env.DIGITALDP_MANAGED_NETWORK = "1";
const port = await chooseStandalonePort();

await import("./server.ts");

if (process.env.DIGITALDP_OPEN_BROWSER !== "0") openTeacherDashboard(teacherDashboardUrl(port));
