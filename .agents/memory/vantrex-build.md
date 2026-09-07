---
name: VANTREX build decisions
description: Durable implementation decisions for the VANTREX iGaming showcase and affiliate platform.
---

The VANTREX catalogue is intentionally empty on first run. Platform and game/betting content must be created through the restricted admin surface rather than seeded.

**Why:** The product requirement explicitly calls for a clean start and admin-controlled catalogue.

**How to apply:** Preserve empty-state handling when extending the API, database, or dashboard; never add demo casino or betting records to migrations or startup code.

Authentication is handled by the Replit-managed Clerk setup, with the operations account restricted to the specified admin email.

**Why:** The app needs Google OAuth and email/password without introducing a local password store.

**How to apply:** Keep browser auth cookie-based and protect API routes with Clerk middleware; do not add JWT/password implementations.