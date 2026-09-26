---
name: Imported native dependencies
description: Why imported dependency folders may not run in Replit's Linux environment.
---

For zip imports, do not assume a present dependency folder is usable. Reinstall from the project's lockfile on Replit if native tooling fails with a platform mismatch.

**Why:** This import carried macOS native binaries even though package listing appeared complete; tests and the dev server failed until a clean Linux install.

**How to apply:** When imported projects fail inside native packages, preserve the existing dependency manifest and lockfile, then reinstall dependencies for the current environment before changing application code.