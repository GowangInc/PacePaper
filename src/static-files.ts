const PAGE_FILES: Readonly<Record<string, string>> = {
  "/": "public/index.html",
  "/admin": "public/index.html",
  "/clock": "public/index.html",
  "/guide": "USER_GUIDE.html",
  "/mock-guides": "docs/mock-marking/index.html",
  "/student": "public/index.html",
  "/presentation": "public/presentation.html",
};

const PUBLIC_ASSET = /^\/[a-z0-9][a-z0-9._-]{0,127}$/u;
const PUBLIC_EXTENSIONS = new Set(["css", "jpeg", "jpg", "js", "png", "webmanifest", "webp"]);

export function publicAssetPath(pathname: string): string | null {
  if (!PUBLIC_ASSET.test(pathname) || pathname.includes("..") || pathname.includes(".test.")) return null;
  const extension = pathname.slice(pathname.lastIndexOf(".") + 1);
  return PUBLIC_EXTENSIONS.has(extension) ? `public/${pathname.slice(1)}` : null;
}

export function staticFilePath(pathname: string): string | null {
  return PAGE_FILES[pathname]
    ?? (pathname === "/tokens.css" ? "tokens.css" : null)
    ?? (pathname === "/paper-authoring/SKILL.md" ? "paper-authoring/SKILL.md" : null)
    ?? publicAssetPath(pathname);
}

export function isStudentStaticPath(pathname: string): boolean {
  return pathname === "/student"
    || pathname === "/tokens.css"
    || publicAssetPath(pathname) !== null;
}

export function guideStylesheetSource(html: string): string | null {
  const styles = [...html.matchAll(/<style>([\s\S]*?)<\/style>/gu)];
  if (styles.length !== 1) return null;
  const stylesheet = styles[0]?.[1];
  if (stylesheet === undefined) return null;
  return `'sha256-${createHash("sha256").update(stylesheet).digest("base64")}'`;
}
import { createHash } from "node:crypto";
