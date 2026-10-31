# Clover Cove · Treasure Duel preview

An isolated, owner-private review environment for the Ireland Trip mini-game. This folder does not modify the existing Next.js trip pages, Supabase schema, production wheel, or real trip balances. Everyone starts with 1,000 sandbox gold. The UI clearly labels this as a preview and lets the reviewer switch demo captains.

## Current agreed rules

- Five islands worth 1 / 2 / 3 / 4 / 5 points. Each captain arranges **12 cannonballs total**, with 0–5 on each island, and locks all five choices before reveal.
- More cannonballs captures that island's points; tied islands award nothing. Highest treasure score wins. A match draw returns both stakes.
- Stake choices are 5% / 10% / 20% of the smaller **available** gold balance, rounded down to tens. Custom stakes must be a multiple of 10, minimum 10, and at most 20% of that smaller balance. Stake is fixed in the invitation; acceptance rechecks affordability and the cap.
- **One outgoing gold attack per Dublin day**, consumed when accepted. **Unlimited incoming acceptances**, which never consume the captain's outgoing allowance. One unanswered/unfinished outgoing challenge at a time. Incoming challenges have no count cap. With seven captains, at most seven new accepted gold matches can start per day across the crew.
- One active challenge between any pair, regardless of direction. A declined/cancelled/unanswered expired invitation frees the outgoing slot and does not consume the daily attack. An accepted match consumes the daily attack even if it expires later.
- Sending reserves the sender's stake. Accepting reserves the receiver's stake. Invitations expire after 24 hours; accepted matches have a new 24-hour submission window. Expiry refunds all reserved stakes, including when only one plan was submitted.
- Free bot practice is unlimited and does not consume gold or daily allowance. One unfinished practice at a time.
- Both participants can leave and return. Server settlement occurs only after both plans are locked. Each can watch the same five-round reveal at their own time.

The earlier simulation used a maximum three scheduled matches per player per day. The updated one-outgoing/unlimited-incoming policy changes the activity distribution; the previous simulated poverty percentages should not be presented as guarantees for this policy. The 20% cap remains conservative relative to the earlier 30% proposal.

## Try the preview

1. Test as Jiet, challenge Dad, and pick 50 / 100 / 200 demo gold.
2. Use “Test as Dad” to accept. Mix or arrange the 12 cannonballs and lock.
3. Switch to Jiet, arrange the other plan, and lock. Watch the reveal.
4. Reload or use another signed-in device: the shared sandbox retains the match and balances.
5. “All rules & preview controls” includes reset and forced-expiry testing. Reset is confirmed before clearing the shared demo.

The published Site stays private to its owner. Access from a second device requires that owner's ChatGPT sign-in. Family access has not been enabled.

## Storage and correctness

The preview uses its own provisioned Cloudflare D1 binding `DB`, not the trip's Supabase project. `drizzle/0000_duel_sandbox.sql` defines a single versioned state row. Each mutation reads the state, validates all rules, and writes using compare-and-swap (`UPDATE ... WHERE version = ?`), retrying version conflicts. Invitation acceptance, escrow, quota updates, locked plans and settlement are one atomic state transition. Request receipts prevent duplicated retries from reserving or paying twice.

The API projects only the current captain's plan until both plans are locked and settled. Other captains' unrelated challenges are omitted. Plans never arrive in the opponent's browser before settlement. Player switching is deliberately permitted **only for this private review app**. It is not production authentication, and there is no claim that it is.

Before integrating into the original mini-game: bind real authenticated identities, remove demo reset/expiry/role-switch tools, explicitly resolve how reservations interact with wheel attacks, implement the quota/escrow transaction in the chosen production store, and test that integration. No existing deployment has been merged or changed by this preview.

## Development and verification

Node 24+ (local SQLite adapter uses `node:sqlite`); no npm dependencies.

```sh
npm run build
npm test
npm run validate
npm run dev
```

`worker/game.mjs` contains portable pure rules. `worker/index.js` contains the D1 HTTP adapter. `worker/page.html` contains the responsive review UI. `scripts/build.mjs` embeds the UI and rules into one dependency-free Worker module. The local adapter applies the same schema to local SQLite. Local SQLite and hosted D1 are separate stores.

The tests exercise scoring, reservations, deterministic payout/refunds, hidden plans, unlimited incoming acceptance with a separate outgoing allowance, daily resets in Dublin across the October clock change, and concurrent/idempotent API calls against actual SQLite. They do not replace production integration or real-browser verification.

Hosting is an independent private Sites project, declared in `.openai/hosting.json`. Schema migrations are packaged for the preview database only. The Sites source repository records the exact deployed source; this same implementation is retained in the Ireland Trip repository on a separate review branch.
