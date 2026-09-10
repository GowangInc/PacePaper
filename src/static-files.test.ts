import { readdir } from "node:fs/promises";
import { describe, expect, test } from "bun:test";
import { guideStylesheetSource, isStudentStaticPath, publicAssetPath, staticFilePath } from "./static-files.ts";

const ROOT_IMPORT = /(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)["'](\/[^"']+\.js)["']/gu;

describe("static application files", () => {
  test("resolves app pages and safe root assets without exposing test modules", () => {
    expect(staticFilePath("/student")).toBe("public/index.html");
    expect(staticFilePath("/guide")).toBe("USER_GUIDE.html");
    expect(staticFilePath("/exam-audio.js")).toBe("public/exam-audio.js");
    expect(staticFilePath("/styles.css")).toBe("public/styles.css");
    expect(staticFilePath("/app-icon-192.png")).toBe("public/app-icon-192.png");
    expect(staticFilePath("/site.webmanifest")).toBe("public/site.webmanifest");
    expect(staticFilePath("/exam-audio.test.js")).toBeNull();
    expect(staticFilePath("/../server.ts")).toBeNull();
    expect(staticFilePath("/unknown.json")).toBeNull();
  });

  test("keeps the LAN surface on the student shell and static browser assets", () => {
    expect(isStudentStaticPath("/student")).toBeTrue();
    expect(isStudentStaticPath("/exam.js")).toBeTrue();
    expect(isStudentStaticPath("/exam-audio.js")).toBeTrue();
    expect(isStudentStaticPath("/admin")).toBeFalse();
    expect(isStudentStaticPath("/clock")).toBeFalse();
    expect(isStudentStaticPath("/guide")).toBeFalse();
    expect(isStudentStaticPath("/mock-guides")).toBeFalse();
    expect(isStudentStaticPath("/USER_GUIDE.html")).toBeFalse();
    expect(isStudentStaticPath("/paper-authoring/SKILL.md")).toBeFalse();
  });

  test("authorizes only the exact single guide stylesheet", () => {
    expect(guideStylesheetSource("<style>body { color: blue; }</style>"))
      .toBe("'sha256-sokadS0efMciREADA7GMJWbN3AjFe0yrFzItCxPq11k='");
    expect(guideStylesheetSource("<style>body { color: blue; } </style>"))
      .not.toBe(guideStylesheetSource("<style>body { color: blue; }</style>"));
    expect(guideStylesheetSource("<script>alert(1)</script>")).toBeNull();
    expect(guideStylesheetSource("<style>a{}</style><style>b{}</style>")).toBeNull();
  });

  test("serves the complete root-relative module graph", async () => {
    const scripts = (await readdir("public")).filter((name) => name.endsWith(".js") && !name.endsWith(".test.js"));
    for (const script of scripts) {
      expect(publicAssetPath(`/${script}`)).toBe(`public/${script}`);
      const source = await Bun.file(`public/${script}`).text();
      for (const match of source.matchAll(ROOT_IMPORT)) {
        const importedPath = match[1] as string;
        const resolved = staticFilePath(importedPath);
        expect(resolved, `${script} imports an unserved module: ${importedPath}`).not.toBeNull();
        expect(await Bun.file(resolved as string).exists(), `${script} imports a missing module: ${importedPath}`).toBeTrue();
      }
    }
  });
});
