# Paper library ownership and deployment decision

Decision snapshot: **2026-09-01**

## What is known

- DigitalDP may begin on individual teacher computers or on one private school server.
- The current application provisions one teacher login and stores classes, students, papers, attachments, sessions, and responses in one SQLite database.
- The current schema has no organization, workspace, paper owner, or visibility boundary. Adding privacy only to papers would leave classes, sessions, assets, and live updates globally visible and would create misleading security.
- Papers can now move between installations as one `.digitaldp-paper` file. The file contains only the paper manifest and its permitted attachments—not users, credentials, classes, sessions, responses, database IDs, or filesystem paths.

## Options considered

### 1. Every paper is shared on the installation

This is the simplest model and matches the current database. On an individual computer, “shared” effectively means the one teacher using it. On a school server, every authenticated teacher would see the same library. The drawback is that drafts and restricted departmental materials would eventually need stronger separation.

### 2. Every paper belongs only to its creator

This gives clear privacy, but it makes collaboration awkward and cannot be implemented honestly until teacher accounts, classes, sessions, assets, and live updates all have coherent tenant boundaries.

### 3. Personal by default with explicit school sharing

This is the best long-term school-server model: a teacher owns a paper, may share a deliberate copy or version with a school workspace, and may export it to another installation. It requires a real organization/membership migration rather than a paper-only column.

## Decision for the prototype

Use an **installation-private shared library** for now, plus explicit one-file export/import between installations. This is reversible, works identically on a laptop and a private server, and does not pretend that incomplete per-teacher isolation is secure.

The current demo build is intentionally narrower than a private server: it binds to the local computer and resets the sole teacher account to `admin` / `admin` at startup. Do not enable network binding until password management exists. The installation-shared model describes data ownership, not authorization for current network deployment.

If DigitalDP gains multiple teachers, implement option 3 across the whole data model:

1. Add organizations/workspaces and memberships.
2. Scope classes, students, papers, assets, sessions, responses, and live-update channels to a workspace.
3. Give papers an owner and `private` or `workspace` visibility.
4. Migrate existing installations into one default workspace, retaining their shared library.
5. Make new papers private by default and require an explicit Share action.
6. Assign ownership at import time; never carry source-installation ownership inside exported files.

## What could change this decision

Move the multi-teacher workspace model earlier if the first pilot uses a shared server with teachers who must not see one another's classes or draft papers. Keep the current model if initial pilots are single-teacher laptops or one trusted departmental installation.
