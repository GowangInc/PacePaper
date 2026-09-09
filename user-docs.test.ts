import { readFileSync } from "node:fs";

// The public-facing docs must not advertise the development course library.
// Counts and mock inventories live in examples/README.md and
// examples/course-samples/README.md (developer indexes) and in frozen
// historical release notes — all deliberately out of scope here.
const FILES = [
  "README.md",
  "USER_GUIDE.md",
  "release/README.md",
  "release/RELEASE_NOTES-0.1.0-demo.9.md",
];

const BANNED = [
  "52 original papers",
  "52-paper",
  "52 papers",
  "wider course library",
  "34 IB-oriented",
  "17 course entries",
  "23 course entries",
  "1F, 2F, 1H",
  "importable demonstrations",
];

describe("user-facing docs", () => {
  for (const file of FILES) {
    test(`${file} carries no course-library inventory`, () => {
      const text = readFileSync(file, "utf8");
      for (const phrase of BANNED) {
        expect(text.toLowerCase()).not.toContain(phrase.toLowerCase());
      }
    });
  }
});
