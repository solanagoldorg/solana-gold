# Deploy Solana Gold

Import the GitHub repository into Vercel. Use the repository root, Node.js 24, the Vite preset, `pnpm build`, and output directory `apps/web/dist`. The committed Vercel configuration supplies the API and asset rewrites.

Copy the values from the separately supplied private deployment configuration into Vercel's environment settings before building. `.env.example` lists all settings. Never commit a populated environment file.

- `GOLD_BACKEND_API_URL`: the existing bounded network API origin.
- `GOLD_BACKEND_ORIGIN`: the origin admitted by that backend.
- `GOLD_IMAGE_API_URL` and `GOLD_IMAGE_ORIGIN`: its image and gallery service, and its admitted origin.
- `GOLD_BACKEND_TOKEN_KIND`: the token discriminator expected by that backend. The public app uses `token`; the adapter translates this field.
- `VITE_EXPECTED_GENESIS_HASH`: the independently verified existing network genesis. This public identifier is required for admission.
- `VITE_NETWORK_ASSET_ORIGIN` and `VITE_IMAGE_ASSET_ORIGIN`: the immutable metadata origins published by those services. These are public asset identifiers, not credentials.
- `VITE_API_BASE_URL`: `/_network`.

The serverless API uses HTTPS origins selected only from deployment settings. It rejects arbitrary upstream URLs, cross-origin browser writes, oversized payloads and unsupported RPC methods. It forwards neither caller cookies nor caller authorization. The backend remains responsible for RPC validation and rate limits.

The wallet, vault and transaction lab verify the same genesis before enabling signing. The asset adapters serve only bounded content-addressed paths. Gold's built-in token images are rendered into PNG before creation so the existing backend stores the new artwork.

After deployment, verify `/_network/api/network`, `/_network/api/status`, the wallet, and the asset routes. Do not treat a passing frontend build as proof of a network release. This deployment connects to existing infrastructure; it does not start a validator or change that infrastructure.
