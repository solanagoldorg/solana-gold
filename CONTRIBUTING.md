# Contributing

Use Node.js 24 and the pnpm version pinned in package.json. Install with `pnpm install --frozen-lockfile`, then run the checks relevant to your change. Start the website with `pnpm dev:web`.

Keep credentials, runtime data, ledgers, generated artifacts and deployment bindings out of commits. Do not start local validators or chain harnesses on the owner's Mac. Server deployment, remote tests and network changes require their own task authorization.

The application is a development preview. An offline test does not establish that a network, bridge or token is live. Preserve all third-party license notices.
