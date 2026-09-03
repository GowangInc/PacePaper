// Bun reads these file imports from disk in development and embeds them when
// `bun build --compile` creates a standalone executable. Do not use ordinary
// JavaScript imports here: browsers must receive the source modules unchanged.
import adminCollections from "../public/admin-collections.js" with { type: "file" };
import adminNetwork from "../public/admin-network.js" with { type: "file" };
import admin from "../public/admin.js" with { type: "file" };
import app from "../public/app.js" with { type: "file" };
import classRosters from "../public/class-rosters.js" with { type: "file" };
import contextMenuLock from "../public/context-menu-lock.js" with { type: "file" };
import countdownModel from "../public/countdown-model.js" with { type: "file" };
import countdownCss from "../public/countdown.css" with { type: "file" };
import countdown from "../public/countdown.js" with { type: "file" };
import examAudio from "../public/exam-audio.js" with { type: "file" };
import exam from "../public/exam.js" with { type: "file" };
import inkCanvas from "../public/ink-canvas.js" with { type: "file" };
import index from "../public/index.html" with { type: "file" };
import paperBuilder from "../public/paper-builder.js" with { type: "file" };
import paperPreview from "../public/paper-preview.js" with { type: "file" };
import presentationCss from "../public/presentation.css" with { type: "file" };
import presentation from "../public/presentation.html" with { type: "file" };
import studentConnection from "../public/student-connection.js" with { type: "file" };
import studentWorkspace from "../public/student-workspace.png" with { type: "file" };
import student from "../public/student.js" with { type: "file" };
import styles from "../public/styles.css" with { type: "file" };
import teacherDashboard from "../public/teacher-dashboard.png" with { type: "file" };
import textHighlights from "../public/text-highlights.js" with { type: "file" };
import paperAuthoringGuide from "../paper-authoring/SKILL.md" with { type: "file" };
import tokens from "../tokens.css" with { type: "file" };

export default {
  "public/admin-collections.js": adminCollections,
  "public/admin-network.js": adminNetwork,
  "public/admin.js": admin,
  "public/app.js": app,
  "public/class-rosters.js": classRosters,
  "public/context-menu-lock.js": contextMenuLock,
  "public/countdown-model.js": countdownModel,
  "public/countdown.css": countdownCss,
  "public/countdown.js": countdown,
  "public/exam-audio.js": examAudio,
  "public/exam.js": exam,
  "public/ink-canvas.js": inkCanvas,
  "public/index.html": index,
  "public/paper-builder.js": paperBuilder,
  "public/paper-preview.js": paperPreview,
  "public/presentation.css": presentationCss,
  "public/presentation.html": presentation,
  "public/student-connection.js": studentConnection,
  "public/student-workspace.png": studentWorkspace,
  "public/student.js": student,
  "public/styles.css": styles,
  "public/teacher-dashboard.png": teacherDashboard,
  "public/text-highlights.js": textHighlights,
  "paper-authoring/SKILL.md": paperAuthoringGuide,
  "tokens.css": tokens,
};
