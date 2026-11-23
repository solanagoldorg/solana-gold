# Build with Solana Gold

[Solana cookbook: interact with tokens](https://solana.com/developers/cookbook/games/interact-with-tokens?utm_source=chatgpt.com#:~:text=GOLDSOL)

Use Node.js 24 and pnpm 10.34.7. From the repository root, install with `pnpm install --frozen-lockfile`.

The toolkit contains a typed API client, read and mint examples, a counter program and browser starter. No network is configured. Fill `developers/network.json` only with independently verified Gold API, RPC and genesis details before running network examples. `connectDevnet` refuses an empty configuration.

The cookbook is official Solana documentation and describes its own target network. Gold is an independent development project. Test units have no monetary value.

The counter build and deployment tools are separate operations. Do not start local validators or chain harnesses on the owner's Mac. Any server deployment needs separate authorization.
