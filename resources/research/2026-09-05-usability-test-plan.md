# DigitalDP usability test plan

Date: 5 September 2026. Applied skill: Owl-Listener `usability-test-plan`, installed locally. This document separates the agent-run technical walkthrough from a future human usability study. No teachers or students have been recruited or observed for this review.

## Research questions

1. Can a non-technical teacher prepare a class and reusable paper without help or accidental loss?
2. Can teacher and student identify the correct sitting and understand waiting, reading, working and submitted states?
3. Can a teacher predict the effect of timing edits on every connected student and clock?
4. Can students preserve work and teachers retrieve a clear completed record?
5. Can a teacher manage multiple clocks, including a timer-only practice session, without confusing their controls?

## Method and participants

First run a technical pilot in a fresh, local scratch database with fictional users, followed by source-based WIG review. Do not measure the automation agent's speed as human task performance.

Then run moderated, in-person or remote, think-aloud sessions with 5–8 teachers of varied technical confidence and exam-system experience. This is an initial qualitative planning target, not statistical representativeness or a guaranteed issue-detection rate. Include novice users and keyboard/assistive-technology users; recruit a separate appropriately consented student group for student tasks. Use fictional rosters and papers, not identifiable school records. Use participants' usual devices/assistive technology where practical. Plan 45–60 minutes for teachers and a shorter selected task set for students; pilot and adjust the workload.

## Eight neutral tasks

Times are proposed planning budgets, not achieved performance or pass/fail thresholds. The facilitator should not reveal the button names or navigation route.

| ID | Participant prompt | Success and recovery evidence | Planning budget |
| --- | --- | --- | --- |
| T1 | Your class has two students. Prepare their list for tomorrow, then add a late arrival. | Correct roster, no duplicate people; list can be exported and reloaded; errors explain how to recover. | 5 min |
| T2 | Prepare a short practice paper in this specified exam format, add one question and improve its instructions. Check what students will receive. | Saved questions, media and timed sections match preview. Changing course or leaving mid-edit does not silently lose work. | 10 min |
| T3 | Arrange an English reading sitting for your class and give students what they need to join. | Correct system/paper selected; useful join address; no countdown starts before explicit teacher action. | 4 min |
| T4 | As a student, join the assigned sitting. Review all available readings, questions and answer choices while waiting for writing time. | Correct identity/sitting; clear connection status; permitted content visible, answers locked only as intended. | 5 min |
| T5 | The reading duration is wrong. Correct it, start the sitting, and verify what both students see. Repeat with a second clock open. | All linked views use one authoritative schedule; live and phased corrections are truthful and consistent. | 5 min |
| T6 | Answer a question, make a working note, add a drawing page, refresh, and finish your paper. | Typed/ink/notepad work persists; recovery and save state truthful; final submission has a clear confirmation and receipt. | 8 min |
| T7 | Retrieve a completed student's paper and prepare it for printing. Find an earlier sitting of the same paper. | Questions, responses and notes present; sitting identity clear; history remains accessible. | 4 min |
| T8 | Run two paper-based practice exams on the classroom screen using only timers, then correct one duration. | No digital paper/roster required; independent waiting/start/reading/work/end states; one edit cannot alter the wrong exam. | 5 min |

If a feature is missing, record **blocked — not implemented**, not participant failure. For safety tests such as ending an exam, use only expendable fictional sittings.

## Facilitation guide

Introduction: “We are testing DigitalDP, not you. Please tell us what you expect to happen and what you find confusing. There are no wrong answers. You may stop at any point.” Explain consent, observers, what is recorded and deletion arrangements; ask separately for recording consent.

Before each task, give only the goal and scenario information. Observe without directing. Neutral prompts: “What are you looking for?” and “What did you expect that to do?” If the participant becomes stuck, first allow recovery, then offer help and record exactly what was supplied. Stop before real data could be harmed.

After a task: ask how easy it was on a consistently anchored 1–7 scale and whether the result matches their expectation. At the end, ask which action felt least safe, what they would need before running a class alone, and whether terms such as paper, exam and session were clear. An optional standard SUS questionnaire can follow; do not invent scores.

## Observation record

Record participant pseudonym/role, device/browser/input method, task ID, start/end time, outcome (unaided/assisted/failed/not implemented), wrong turns, errors, recovery attempts, help given, ease/confidence answer and evidence pointer. Capture direct quotations only when actually said and consented; separate observations from interpretations. Avoid student names, cookies and credentials in recordings or reports.

## Analysis

Group issues by root cause. Prioritize data loss, incorrect timing, wrong exam assignment and inaccessible core actions before visual polish. For each finding retain reproduction steps, affected states, severity, evidence type and an observable acceptance test. Report technical checks separately from human completion/time/error measures; report denominators and missing results. Compare repeat rounds only where tasks and conditions remain comparable.

## Pilot checklist

- [ ] Scratch database and fictional accounts verified; real classroom service unchanged.
- [ ] Current source/build and tested browser versions recorded.
- [ ] Teacher, student and second-screen sessions isolated and reachable.
- [ ] Timing fixtures and any accelerated time clearly identified.
- [ ] Recording consent/privacy process ready for human sessions.
- [ ] Tasks do not disclose the required UI path.
- [ ] Keyboard, zoom and error/recovery paths included.
- [ ] Observer can record evidence without coaching.
- [ ] Print destination and portable-file round trip checked.
- [ ] Missing features marked separately from usability failures.
- [ ] Every owned test service/browser closed after the pilot.

## Sources

Task/participant/observation structure follows the installed [Usability Test Plan skill](https://github.com/Owl-Listener/designer-skills/blob/main/design-research/skills/usability-test-plan/SKILL.md). Neutral goal-based tasks and moderated observation are grounded in [GOV.UK usability-testing guidance](https://www.gov.uk/service-manual/user-research/using-moderated-usability-testing). Automated accessibility checks do not establish conformance; see [W3C evaluation guidance](https://www.w3.org/WAI/test-evaluate/).
