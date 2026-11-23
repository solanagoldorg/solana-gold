# Solana Gold

[Source repository](https://github.com/solanagoldorg/solana-gold)

<img src="apps/web/public/solana-gold-mark.png" alt="Solana Gold mark" width="220"/>

Solana Gold is an independent SVM L1 blockchain for transfers, tokens and on-chain applications. Includes Gold Lab, a browser wallet, an asset view, explorer, API and developer tools.

**Mint / CA (reserved)**

```text
kpD9MSKBDSNFqvsEAVkQH1PhKGwVYGD5Coo7YFggoLd
```

[Solana cookbook: interact with tokens](https://solana.com/developers/cookbook/games/interact-with-tokens?utm_source=chatgpt.com#:~:text=GOLDSOL)

## Built with ambition

**On November 26, 2017, Bitcoin Gold was #5 at $6.1B in market capitalization.** [CoinMarketCap historical snapshot](https://coinmarketcap.com/historical/20171126/).

That scale is an inspiration for Solana Gold’s ambition.

## Run the web preview

Use Node.js 24 and pnpm 10.34.7.

```sh
pnpm install --frozen-lockfile
pnpm dev:web
```

```sh
pnpm typecheck
pnpm test:unit
pnpm test:integration
pnpm test:wallet
pnpm build
```

The preview opens at the local URL printed by Vite. `pnpm dev` starts only the frontend. It does not start a validator or a chain.

## Network and token status

Network connections are supplied through deployment environment variables. No token mint, team wallet, trading address or deployed bridge is configured in the source. The UI keeps network actions disabled until an API and matching expected genesis have been configured and verified. Test units have no monetary value. A new network release needs separate authorization and validation.

The `.example.invalid` hosts in reference adapters are intentionally non-routable examples. Set `VITE_API_BASE_URL` and `VITE_EXPECTED_GENESIS_HASH` for a reviewed web connection. The wallet and developer client have separate connection settings that must match that release. Never substitute another network identity just to enable transactions.

## Source

| Directory | Contents |
| --- | --- |
| `apps/web` | Website, playground, gallery and explorer |
| `apps/api` | Bounded gateway, faucet and asset services |
| `wallet` | Test wallet, encrypted browser vault and creation flows |
| `packages` | Shared configuration and transaction helpers |
| `developers` | Client, minting examples and program tooling |
| `engine/agave` | Upstream Agave source snapshot |
| `bridge`, `mainnet`, `engine` | Network research and server-side tooling; separate validation required |
| `infra` | Reference hosting and API adapters |

No previous Git history or deployment state is included. Publish to a new empty repository; never mirror-push another project’s history. See [deployment setup](docs/DEPLOY.md) for the existing-backend adapter and required environment settings.

## License

Repository-owned material is MIT licensed. Upstream Agave and dependencies keep their original licenses, attribution and notices; see [LICENSE](LICENSE), [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and [engine/upstream.json](engine/upstream.json).
