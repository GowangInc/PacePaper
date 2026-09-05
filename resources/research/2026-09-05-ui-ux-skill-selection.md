# UI/UX skill selection for DigitalDP

Reviewed: 5 September 2026. Status: recommendation, not installation or application changes.

## Decision

Add one lightweight usability-planning skill first: **Owl-Listener's `usability-test-plan`**. Keep Web Interface Guidelines (WIG) for implementation checks and the existing browser-testing capability for repeatable functional evidence. Treat Hallmark as an optional visual-consistency pass, not the authority on whether teachers can operate an examination confidently.

This is a fit assessment based on inspected instructions and dependencies, not a benchmark proving that one skill produces better results. Skills package workflows and optional tools; installing them does not establish that real users find an application usable. See [OpenAI's skills documentation](https://learn.chatgpt.com/docs/build-skills).

## Shortlist

Counts below are discovery-time snapshots from skills.sh and GitHub, not quality scores. Repository stars describe the whole repository, not the individual skill.

| Candidate | Adoption observed | DigitalDP fit | Recommendation |
| --- | --- | --- | --- |
| [Usability Test Plan — Owl-Listener](https://www.skills.sh/owl-listener/designer-skills/usability-test-plan) | About 1.5K installs; 2,504 repository stars | Realistic tasks, participant selection, success/time/error metrics, facilitation and observation plan | Best first addition |
| [Impeccable — Paul Bakaus](https://www.skills.sh/pbakaus/impeccable/impeccable) | About 262K installs; 65,690 repository stars | Operate, Shape, Clarify and Harden guidance is relevant to a restrained admin application | Consider later, with explicit scope and testing safeguards |
| [AccessLint accessibility-audit](https://skills.sh/accesslint/skills/accessibility-audit) | 467 installs in CLI search; 94 repository stars | Sample complete flows; separate automated findings, judgment calls and human-required testing | Promising specialist option; more setup and less adoption, so evaluate before adopting |
| [UI/UX Pro Max](https://www.skills.sh/nextlevelbuilder/ui-ux-pro-max-skill/ui-ux-pro-max) | About 344.8K installs; 125,105 repository stars | Searchable component, layout, form and style guidance | Lower priority: considerable overlap with existing implementation guidance |

### Usability Test Plan

The [inspected skill](https://github.com/Owl-Listener/designer-skills/blob/main/design-research/skills/usability-test-plan/SKILL.md) is a short, instruction-only file; its directory contains no executable scripts. It asks for research questions, realistic tasks, success criteria, observation records and a pilot checklist. Its companion [test-scenario skill](https://github.com/Owl-Listener/designer-skills/blob/main/prototyping-testing/skills/test-scenario/SKILL.md) is also relevant to neutral task wording and recovery scenarios, but is not required for the initial recommendation.

Limitations: this plans research; it does not recruit participants or produce observed results. Its suggested participant counts are planning defaults, not statistical guarantees. We must label findings as **observed**, **inferred**, or **proposed**, and never describe agent simulations as teacher research.

Suggested installation, only after approval:

```sh
npx skills add https://github.com/owl-listener/designer-skills --skill usability-test-plan
```

Install only this named skill, not the entire collection.

### Impeccable

[Operate](https://github.com/pbakaus/impeccable/blob/main/.agents/skills/impeccable/reference/operate.md) explicitly prioritizes task completion and familiarity for admin tools. [Clarify](https://github.com/pbakaus/impeccable/blob/main/.agents/skills/impeccable/reference/clarify.md) covers understandable actions and errors; [Harden](https://github.com/pbakaus/impeccable/blob/main/.agents/skills/impeccable/reference/harden.md) covers failure states and awkward inputs.

However, the [current main skill](https://github.com/pbakaus/impeccable/blob/main/.agents/skills/impeccable/SKILL.md) requires a launcher that may download a native binary on first use and limits verification to two rounds. Neither that limit nor a self-assigned design score is an acceptable gate for DigitalDP's timing, response preservation or multi-client correctness. This is not merely a Markdown checklist. The user's utilitarian brief and thorough-testing requirement must prevail.

Optional installation command for a later decision:

```sh
npx skills add https://github.com/pbakaus/impeccable --skill impeccable
```

### AccessLint

The [audit instructions](https://github.com/AccessLint/skills/blob/main/plugins/accesslint/skills/accessibility-audit/SKILL.md) have a useful distinction between verified failures, issues needing judgment and checks requiring people or assistive technology. Unexercised criteria remain undetermined rather than becoming a false pass.

The [README](https://github.com/AccessLint/skills) describes companion scan/inspect skills, a local CLI, a debuggable browser and optional MCP support. The audit skill alone is not a complete installation. Current scan instructions use latest-version packages and a broad managed-browser teardown; any trial should pin reviewed versions, isolate its test browser and preserve other browser sessions. No hosted connector or student-data upload is needed for the local route. This is a dependency review, not a security certification.

The repository's documented collection installer is below, but this is **not** the recommended first installation:

```sh
npx skills add AccessLint/skills
```

### Why not simply use the largest UX toolkit?

The [UI/UX Pro Max source](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/.claude/skills/ui-ux-pro-max/SKILL.md) has useful narrowly scoped lookup and preservation instructions. It also adds a local Python search tool and extensive style data. Its [quick reference](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/.claude/skills/ui-ux-pro-max/references/quick-reference.md) contains blanket rules about virtualization, transient notifications and animation that need contextual judgment. Its popularity does not resolve classroom workflow questions.

Another candidate, alirezarezvani's UX Researcher Designer, has substantial research references, but its [persona generator](https://github.com/alirezarezvani/claude-skills/blob/main/product-team/skills/ux-researcher-designer/scripts/persona_generator.py) uses bundled sample users and can fill missing evidence with stock quotations and complaints. It should not be used unchanged to characterize DigitalDP teachers. Refound's usability-testing skill was also considered, but its indexed installation path was absent from the current repository tree; it is not a verified-current recommendation.

## How the selected approach would be used

1. Map the teacher's actual job before changing the interface: prepare class, choose paper, check attendees, start, adjust, finish and retrieve responses.
2. Review those flows against primary usability and accessibility guidance. Record severity, reproducible evidence and consequences; do not invent an overall compliance percentage.
3. Use isolated browser tests to verify behavior, including failures and recovery. This supplies technical evidence, not proof of human usability.
4. Prepare short, neutral tasks for non-technical teachers. Record unaided completion, wrong turns, help requests, time and confidence.
5. Revise confusing interactions, repeat affected tests, and then refresh guide screenshots from the verified interface.

Priority scenarios include correcting reading time and verifying every connected student; managing two or three concurrent exams without confusing their clocks; recovering after refresh; retaining an unfinished paper; avoiding accidental final submission; and finding completed work.

For the proposed standalone clock, the scenario set should cover creating one or several timer-only exams without class/paper records, leaving them waiting until an explicit Start, moving from reading to writing time, displaying independent timers on a second screen, editing one timer without changing others, and clearly distinguishing a local timer from a linked exam whose timing affects students. These are proposed tests and design requirements, not claims that the feature has been implemented.

## Scope and safety

Two subagents independently reviewed usability and design candidates; the main review covered accessibility candidates and checked the recommended skill source. Discovery used the skills.sh leaderboard and keyword search, then source inspection. No candidate scripts were executed, no skills or plugins installed, no external service connected, and no application code, live exam data or releases changed for this comparison. The CLI used for search may populate its normal package cache.
