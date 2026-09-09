import { readFileSync, writeFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";

interface GuideFigure {
  alt: string;
  caption: string;
  height: number;
  path: string;
  width: number;
}

const root = resolve(import.meta.dir, "..");
export const userGuideMarkdownPath = join(root, "USER_GUIDE.md");
export const userGuideHtmlPath = join(root, "USER_GUIDE.html");

const figuresByHeading: Readonly<Record<string, readonly GuideFigure[]>> = {
  "Step 2 — Let students connect": [
    {
      path: "docs/user-guide/screenshots/overview.png",
      alt: "PacePaper teacher dashboard Overview showing the student sign-in address and classroom-sharing controls.",
      caption: "Overview shows the student address, classroom-sharing choice, and current class, paper, and session totals.",
      width: 1280,
      height: 900,
    },
  ],
  "Step 3 — Prepare the class": [
    {
      path: "docs/user-guide/screenshots/classes.png",
      alt: "PacePaper Classes area showing a class roster, candidate codes, extra time, and student management controls.",
      caption: "Classes keeps the roster, candidate codes, extra-time allowances, and add, edit, or remove controls together.",
      width: 1280,
      height: 900,
    },
  ],
  "Step 4 — Choose or create the paper": [
    {
      path: "docs/user-guide/screenshots/builder-draft-recovery.png",
      alt: "Paper Builder with a saved browser draft and the Recover an unfinished paper selector.",
      caption: "Wait for Draft saved in this browser. Restore an unfinished paper here, including its attachments.",
      width: 1280,
      height: 900,
    },
    {
      path: "docs/user-guide/screenshots/paper-builder.png",
      alt: "PacePaper Paper library area showing the example-paper library and exam-format choices in Paper Builder.",
      caption: "Paper library combines the included practice papers with an exam-aware Paper Builder and live preview.",
      width: 1280,
      height: 900,
    },
  ],
  "Step 5 — Set up the exam session": [
    {
      path: "docs/user-guide/screenshots/session.png",
      alt: "PacePaper Sessions area showing an exam sitting, its clock control, and the class, exam-system, and paper selectors.",
      caption: "Sessions first narrows papers by exam system, then assigns a reusable paper to a class for a specific sitting.",
      width: 1280,
      height: 900,
    },
  ],
  "Step 6 — Open the examination clock": [
    {
      path: "docs/user-guide/screenshots/linked-clock.png",
      alt: "Linked examination clock showing Ready to start, student connection address, names and the saved AP phase plan.",
      caption: "Linked clocks wait for Start exam and use the saved schedule. Fixed sections and live timings are read-only.",
      width: 1280,
      height: 900,
    },
  ],
  "Step 7 — Ask students to join": [
    {
      path: "docs/user-guide/screenshots/student-sign-in.png",
      alt: "PacePaper candidate sign-in showing a class code and a loaded student-name list.",
      caption: "Students enter the class code, load the roster, and choose their own name.",
      width: 1280,
      height: 900,
    },
    {
      path: "docs/user-guide/screenshots/student-choose-exam.png",
      alt: "PacePaper candidate page showing an available AP Biology practice examination and its Join waiting room button.",
      caption: "After signing in, each student chooses the requested examination and joins its waiting room.",
      width: 1280,
      height: 900,
    },
  ],
  "Step 8 — Start and monitor the exam": [
    {
      path: "docs/user-guide/screenshots/student-exam.png",
      alt: "PacePaper English B reading view showing Text A, tabs for Texts B and C, visible questions, and locked response areas during reading time.",
      caption: "During reading time, students can switch between all texts and read the questions and answer choices. Response areas stay locked until writing time begins.",
      width: 1440,
      height: 900,
    },
  ],
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function plainText(value: string): string {
  return value.replace(/<[^>]+>/gu, "").replaceAll("&amp;", "&").replaceAll("&quot;", '"').trim();
}

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-|-$/gu, "");
}

function embeddedImage(relativePath: string): string {
  const bytes = readFileSync(join(root, relativePath));
  const extension = extname(relativePath).toLowerCase();
  const mime = extension === ".jpg" || extension === ".jpeg" ? "image/jpeg" : "image/png";
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

function figureMarkup(figure: GuideFigure): string {
  return `<figure class="guide-shot">
  <div class="guide-shot__frame"><img src="${embeddedImage(figure.path)}" width="${figure.width}" height="${figure.height}" loading="lazy" decoding="async" alt="${escapeHtml(figure.alt)}"></div>
  <figcaption>${escapeHtml(figure.caption)} <span>Example data and addresses will differ on your computer.</span></figcaption>
</figure>`;
}

export function renderUserGuideHtml(): string {
  const markdown = readFileSync(userGuideMarkdownPath, "utf8");
  const headingCounts = new Map<string, number>();
  const tableOfContents: Array<{ id: string; label: string }> = [];
  let rendered = Bun.markdown.html(markdown);

  rendered = rendered.replace(/<h([1-3])>([\s\S]*?)<\/h\1>/gu, (_match, rawLevel: string, contents: string) => {
    const level = Number(rawLevel);
    const label = plainText(contents);
    const baseId = slugify(label) || `section-${tableOfContents.length + 1}`;
    const seen = headingCounts.get(baseId) ?? 0;
    headingCounts.set(baseId, seen + 1);
    const id = seen === 0 ? baseId : `${baseId}-${seen + 1}`;
    if (level === 2) tableOfContents.push({ id, label });
    const figures = level === 2 ? figuresByHeading[label] ?? [] : [];
    return `<h${level} id="${id}">${contents}</h${level}>${figures.map(figureMarkup).join("\n")}`;
  });

  const navigation = tableOfContents
    .map(({ id, label }) => `<li><a href="#${id}">${escapeHtml(label)}</a></li>`)
    .join("\n");
  const icon = embeddedImage("public/app-icon-64.png");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Straightforward, illustrated instructions for running a PacePaper classroom practice examination.">
  <link rel="icon" href="${icon}">
  <title>PacePaper teacher guide</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #17202d;
      --muted: #526174;
      --blue: #0059a8;
      --blue-dark: #003f78;
      --blue-soft: #e9f4ff;
      --line: #c8d7e7;
      --paper: #ffffff;
      --page: #f4f7fa;
      --success: #087b49;
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      background: var(--page);
      color: var(--ink);
      font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 17px;
      line-height: 1.62;
    }
    a { color: var(--blue-dark); text-underline-offset: 0.16em; }
    a:hover { color: var(--blue); }
    :focus-visible { outline: 3px solid #ffbf47; outline-offset: 3px; }
    .skip-link {
      position: fixed;
      z-index: 10;
      top: 0.75rem;
      left: 0.75rem;
      padding: 0.55rem 0.8rem;
      border-radius: 0.3rem;
      background: var(--ink);
      color: white;
      transform: translateY(-180%);
    }
    .skip-link:focus { transform: translateY(0); }
    .site-header {
      border-bottom: 1px solid #164f89;
      background: linear-gradient(115deg, #061c33 0%, #0a3763 70%, #0059a8 100%);
      color: white;
    }
    .site-header__inner {
      display: flex;
      max-width: 1240px;
      min-height: 86px;
      margin: 0 auto;
      padding: 1rem 1.5rem;
      align-items: center;
      gap: 0.9rem;
    }
    .site-header img { width: 52px; height: 52px; }
    .site-header strong { display: block; font-size: 1.25rem; letter-spacing: -0.02em; }
    .site-header span { display: block; color: #cce4fb; font-size: 0.9rem; }
    .layout {
      display: grid;
      grid-template-columns: minmax(220px, 270px) minmax(0, 900px);
      max-width: 1240px;
      margin: 0 auto;
      padding: 2rem 1.5rem 4rem;
      gap: 2rem;
      align-items: start;
    }
    .guide-nav {
      position: sticky;
      top: 1rem;
      max-height: calc(100vh - 2rem);
      overflow: auto;
      padding: 1.1rem;
      border: 1px solid var(--line);
      border-top: 4px solid var(--blue);
      background: var(--paper);
    }
    .guide-nav strong { display: block; margin-bottom: 0.6rem; color: var(--blue-dark); }
    .guide-nav ol { margin: 0; padding-left: 1.25rem; }
    .guide-nav li { margin: 0.25rem 0; font-size: 0.88rem; line-height: 1.35; }
    .guide-nav a { text-decoration: none; }
    .guide-nav a:hover { text-decoration: underline; }
    .guide {
      min-width: 0;
      padding: clamp(1.5rem, 4vw, 3.75rem);
      border: 1px solid var(--line);
      background: var(--paper);
      box-shadow: 0 18px 50px rgba(22, 45, 69, 0.08);
    }
    .guide > :first-child { margin-top: 0; }
    .guide h1 {
      margin-bottom: 0.65rem;
      color: #082e55;
      font-size: clamp(2.2rem, 5vw, 3.8rem);
      line-height: 1.04;
      letter-spacing: -0.045em;
    }
    .guide h1 + p {
      max-width: 68ch;
      margin-top: 0;
      color: var(--muted);
      font-size: 1.08rem;
    }
    .guide h2 {
      margin: 3.3rem 0 1rem;
      padding-top: 0.9rem;
      border-top: 3px solid var(--blue);
      color: #082e55;
      font-size: clamp(1.55rem, 3vw, 2.1rem);
      line-height: 1.2;
      letter-spacing: -0.025em;
      scroll-margin-top: 1rem;
    }
    .guide h3 {
      margin: 2rem 0 0.7rem;
      color: #163f68;
      font-size: 1.25rem;
      line-height: 1.3;
      scroll-margin-top: 1rem;
    }
    .guide p, .guide li { max-width: 76ch; }
    .guide ol, .guide ul { padding-left: 1.5rem; }
    .guide li { margin-block: 0.32rem; }
    .guide code {
      padding: 0.12rem 0.3rem;
      border: 1px solid #d8e2ec;
      border-radius: 0.25rem;
      background: #f3f6f9;
      font-size: 0.9em;
      overflow-wrap: anywhere;
    }
    .guide table {
      width: 100%;
      margin: 1.25rem 0 1.75rem;
      border-collapse: collapse;
      font-size: 0.94rem;
    }
    .guide th, .guide td {
      padding: 0.75rem;
      border: 1px solid var(--line);
      text-align: left;
      vertical-align: top;
      overflow-wrap: anywhere;
    }
    .guide th { background: var(--blue-soft); color: #0b3c69; }
    .guide th:first-child, .guide td:first-child {
      width: 24%;
      overflow-wrap: normal;
      word-break: normal;
    }
    .guide blockquote {
      margin: 1.5rem 0;
      padding: 0.8rem 1rem;
      border-left: 4px solid var(--blue);
      background: var(--blue-soft);
    }
    .guide-shot { margin: 1.4rem 0 1.8rem; }
    .guide-shot__frame {
      overflow: hidden;
      border: 1px solid #8ba9c7;
      border-radius: 0.45rem;
      background: #edf3f8;
      box-shadow: 0 10px 28px rgba(20, 53, 84, 0.11);
    }
    .guide-shot img {
      display: block;
      width: 100%;
      height: auto;
    }
    .guide-shot figcaption {
      margin-top: 0.55rem;
      color: var(--muted);
      font-size: 0.86rem;
      line-height: 1.45;
    }
    .guide-shot figcaption span { color: #6c7886; }
    .guide-footer {
      max-width: 1240px;
      margin: -2rem auto 0;
      padding: 0 1.5rem 2.5rem;
      color: var(--muted);
      text-align: center;
      font-size: 0.86rem;
    }
    @media (max-width: 900px) {
      .layout { display: block; padding: 1rem; }
      .guide-nav { position: static; max-height: none; margin-bottom: 1rem; }
      .guide { padding: clamp(1.2rem, 5vw, 2.2rem); }
      .guide table { font-size: 0.84rem; }
      .guide th, .guide td { padding: 0.55rem; }
    }
    @media (max-width: 520px) {
      body { font-size: 16px; }
      .site-header__inner { padding-inline: 1rem; }
      .layout { padding-inline: 0.55rem; }
      .guide { padding-inline: 1rem; }
    }
    @media (prefers-reduced-motion: reduce) {
      html { scroll-behavior: auto; }
    }
    @page { size: A4; margin: 16mm; }
    @media print {
      body { background: white; color: black; font-size: 10pt; line-height: 1.45; }
      .skip-link, .site-header, .guide-nav, .guide-footer { display: none; }
      .layout { display: block; max-width: none; margin: 0; padding: 0; }
      .guide { max-width: none; padding: 0; border: 0; box-shadow: none; }
      .guide h1 { font-size: 28pt; }
      .guide h2 { margin-top: 22pt; break-after: avoid; color: black; }
      .guide h3 { break-after: avoid; color: black; }
      .guide-shot, .guide table { break-inside: avoid; }
      .guide-shot__frame { border-color: #777; box-shadow: none; }
      .guide-shot img { max-height: 190mm; object-fit: contain; }
      a { color: black; }
    }
  </style>
</head>
<body>
  <a class="skip-link" href="#main-content">Skip to the guide</a>
  <header class="site-header">
    <div class="site-header__inner">
      <img src="${icon}" width="52" height="52" alt="">
      <div><strong>PacePaper</strong><span>Illustrated teacher guide</span></div>
    </div>
  </header>
  <div class="layout">
    <aside class="guide-nav">
      <nav aria-label="Guide sections">
        <strong>On this page</strong>
        <ol>${navigation}</ol>
      </nav>
    </aside>
    <main id="main-content">
      <article class="guide">${rendered}</article>
    </main>
  </div>
  <footer class="guide-footer">This illustrated file is generated from the plain-text <code>USER_GUIDE.md</code> so both versions stay in step.</footer>
</body>
</html>
`;
}

export function buildUserGuide(): void {
  writeFileSync(userGuideHtmlPath, renderUserGuideHtml());
}

if (import.meta.main) {
  buildUserGuide();
  console.log(`Created ${userGuideHtmlPath}`);
}
