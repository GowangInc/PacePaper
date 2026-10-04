import pdfAnnotations from "../public/pdf-annotations.js" with { type: "file" };
import pdfMin from "../public/pdf.min.mjs" with { type: "file" };
import pdfWorkerMin from "../public/pdf.worker.min.mjs" with { type: "file" };
// Bun reads these file imports from disk in development and embeds them when
// `bun build --compile` creates a standalone executable. Do not use ordinary
// JavaScript imports here: browsers must receive the source modules unchanged.
import adminCollections from "../public/admin-collections.js" with { type: "file" };
import adminEndExam from "../public/admin-end-exam.js" with { type: "file" };
import responseSaveState from "../public/response-save-state.js" with { type: "file" };
import paperBuilderDrafts from "../public/paper-builder-drafts.js" with { type: "file" };
import adminNetwork from "../public/admin-network.js" with { type: "file" };
import adminPapers from "../public/admin-papers.js" with { type: "file" };
import admin from "../public/admin.js" with { type: "file" };
import appIcon64 from "../public/app-icon-64.png" with { type: "file" };
import appIcon192 from "../public/app-icon-192.png" with { type: "file" };
import appIcon512 from "../public/app-icon-512.png" with { type: "file" };
import app from "../public/app.js" with { type: "file" };
import appleTouchIcon from "../public/apple-touch-icon.png" with { type: "file" };
import classRosters from "../public/class-rosters.js" with { type: "file" };
import calculatorHandheld from "../public/calculator-handheld.js" with { type: "file" };
import calculatorEntry from "../public/calculator-entry.js" with { type: "file" };
import calculatorTools from "../public/calculator-tools.js" with { type: "file" };
import calculatorNumeric from "../public/calculator-numeric.js" with { type: "file" };
import calculatorValues from "../public/calculator-values.js" with { type: "file" };
import calculatorMatrix from "../public/calculator-matrix.js" with { type: "file" };
import calculatorDistributions from "../public/calculator-distributions.js" with { type: "file" };
import calculatorStatistics from "../public/calculator-statistics.js" with { type: "file" };
import calculatorFinance from "../public/calculator-finance.js" with { type: "file" };
import calculatorAlgebra from "../public/calculator-algebra.js" with { type: "file" };
import calculatorEngine from "../public/calculator-engine.js" with { type: "file" };
import calculatorToolForm from "../public/calculator-tool-form.js" with { type: "file" };
import calculatorExamTools from "../public/calculator-exam-tools.js" with { type: "file" };
import calculatorChart from "../public/calculator-chart.js" with { type: "file" };
import calculatorPlots from "../public/calculator-plots.js" with { type: "file" };
import calculatorCurves from "../public/calculator-curves.js" with { type: "file" };
import calculator from "../public/calculator.js" with { type: "file" };
import calculatorDemo from "../public/calculator-demo.js" with { type: "file" };
import contextMenuLock from "../public/context-menu-lock.js" with { type: "file" };
import countdownModel from "../public/countdown-model.js" with { type: "file" };
import countdownCss from "../public/countdown.css" with { type: "file" };
import countdown from "../public/countdown.js" with { type: "file" };
import examAudio from "../public/exam-audio.js" with { type: "file" };
import examFormatProfiles from "../public/exam-format-profiles.js" with { type: "file" };
import examPhaseModel from "../public/exam-phase-model.js" with { type: "file" };
import exam from "../public/exam.js" with { type: "file" };
import clientId from "../public/client-id.js" with { type: "file" };
import inkCanvas from "../public/ink-canvas.js" with { type: "file" };
import index from "../public/index.html" with { type: "file" };
import paperBuilder from "../public/paper-builder.js" with { type: "file" };
import paperBuilderDom from "../public/paper-builder-dom.js" with { type: "file" };
import paperPreview from "../public/paper-preview.js" with { type: "file" };
import previewAudio from "../public/preview-audio.js" with { type: "file" };
import presentationCss from "../public/presentation.css" with { type: "file" };
import presentation from "../public/presentation.html" with { type: "file" };
import resourceText from "../public/resource-text.js" with { type: "file" };
import siteWebmanifest from "../public/site.webmanifest" with { type: "file" };
import studentConnection from "../public/student-connection.js" with { type: "file" };
import studentWorkspace from "../public/student-workspace.png" with { type: "file" };
import student from "../public/student.js" with { type: "file" };
import theme from "../public/theme.js" with { type: "file" };
import styles from "../public/styles.css" with { type: "file" };
import teacherDashboard from "../public/teacher-dashboard.png" with { type: "file" };
import textHighlights from "../public/text-highlights.js" with { type: "file" };
import paperAuthoringGuide from "../paper-authoring/SKILL.md" with { type: "file" };
import tokens from "../tokens.css" with { type: "file" };
import userGuide from "../USER_GUIDE.html" with { type: "file" };

export default {
  "public/admin-end-exam.js": adminEndExam,
  "public/response-save-state.js": responseSaveState,
  "public/paper-builder-drafts.js": paperBuilderDrafts,
  "public/admin-collections.js": adminCollections,
  "public/admin-network.js": adminNetwork,
  "public/admin-papers.js": adminPapers,
  "public/admin.js": admin,
  "public/app-icon-64.png": appIcon64,
  "public/app-icon-192.png": appIcon192,
  "public/app-icon-512.png": appIcon512,
  "public/app.js": app,
  "public/apple-touch-icon.png": appleTouchIcon,
  "public/calculator-demo.js": calculatorDemo,
  "public/calculator-numeric.js": calculatorNumeric,
  "public/calculator-values.js": calculatorValues,
  "public/calculator-matrix.js": calculatorMatrix,
  "public/calculator-distributions.js": calculatorDistributions,
  "public/calculator-statistics.js": calculatorStatistics,
  "public/calculator-finance.js": calculatorFinance,
  "public/calculator-algebra.js": calculatorAlgebra,
  "public/calculator-engine.js": calculatorEngine,
  "public/calculator-tool-form.js": calculatorToolForm,
  "public/calculator-exam-tools.js": calculatorExamTools,
  "public/calculator-chart.js": calculatorChart,
  "public/calculator-plots.js": calculatorPlots,
  "public/calculator-curves.js": calculatorCurves,
  "public/calculator.js": calculator,
  "public/calculator-handheld.js": calculatorHandheld,
  "public/calculator-entry.js": calculatorEntry,
  "public/calculator-tools.js": calculatorTools,
  "public/client-id.js": clientId,
  "public/class-rosters.js": classRosters,
  "public/context-menu-lock.js": contextMenuLock,
  "public/countdown-model.js": countdownModel,
  "public/countdown.css": countdownCss,
  "public/countdown.js": countdown,
  "public/exam-audio.js": examAudio,
  "public/exam-format-profiles.js": examFormatProfiles,
  "public/exam-phase-model.js": examPhaseModel,
  "public/exam.js": exam,
  "public/ink-canvas.js": inkCanvas,
  "public/index.html": index,
  "public/paper-builder.js": paperBuilder,
  "public/paper-builder-dom.js": paperBuilderDom,
  "public/paper-preview.js": paperPreview,
  "public/preview-audio.js": previewAudio,
  "public/presentation.css": presentationCss,
  "public/presentation.html": presentation,
  "public/resource-text.js": resourceText,
  "public/site.webmanifest": siteWebmanifest,
  "public/student-connection.js": studentConnection,
  "public/student-workspace.png": studentWorkspace,
  "public/student.js": student,
  "public/theme.js": theme,
  "public/styles.css": styles,
  "public/teacher-dashboard.png": teacherDashboard,
  "public/text-highlights.js": textHighlights,
  "public/pdf-annotations.js": pdfAnnotations,
  "public/pdf.min.mjs": pdfMin,
  "public/pdf.worker.min.mjs": pdfWorkerMin,
  "paper-authoring/SKILL.md": paperAuthoringGuide,
  "tokens.css": tokens,
  "USER_GUIDE.html": userGuide,
};
