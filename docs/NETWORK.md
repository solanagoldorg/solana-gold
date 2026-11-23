# Network configuration

No endpoint or genesis is configured. Web reads use `VITE_API_BASE_URL`; transaction admission also requires `VITE_EXPECTED_GENESIS_HASH` to match API facts and status. Wallet settings live in `wallet/src/display.ts` and `wallet/src/gateway.ts`; developer settings live in `developers/network.json`. Update all connection surfaces together for a reviewed release.

Reference adapters use reserved `.example.invalid` hosts. They cannot route to a live service. No keys, genesis files, snapshots or runtime ledgers are distributed here. Local validators and chain harnesses must not be started on the owner's Mac.
