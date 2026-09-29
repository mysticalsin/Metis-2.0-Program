# Draft — request to the Cloudflare account owner (NOT SENT)

To: <Cloudflare account owner for the Mantu account — role; Tony names the person>
Subject: Métis 2.0: four Cloudflare confirmations and authorisations, first needed by 2026-10-12

Hello,

Métis, the meeting copilot I build for Mantu, uses Cloudflare for speech, the Operator backend and asset delivery. I need four things from the account owner. Nothing below asks you to share a secret with me: a scoped token, or a readback you run yourself, is enough.

| # | What I need | Needed by | Blocks (tickets) |
|---|---|---|---|
| B-14 | Confirm the Workers AI `@cf/deepgram/nova-3` entitlement and its data-use terms on the Mantu account, and give a read-only readback of the AI Gateway log and cache settings | 2026-10-12 | M2-0102 |
| B-19 | Authorise a staging Worker and a D1 database on the Mantu account, or grant an API token scoped to only those two | 2026-10-18 | M2-0103 |
| B-29 | Authorise an R2 bucket for immutable reviewed assets | 2026-10-26 | M2-0162 |
| B-33 | Authorise an isolated D1 restore drill on the staging database (D1 Time Travel) and approve the capability kill-switch names | 2026-11-02 | M2-0159 |

Why now: until these exist the live speech route and the staging chain stay marked BLOCKED in the product; the engineering work proceeds against local fakes in the meantime, so no delay hits you before the dates above.

Privacy note: the company policy for speech is metadata-only gateway logs, with no payload logging or caching (decision D-12, answered 2026-09-27). Please tell me if the account settings differ.

Could you confirm each item, or tell me who owns it?

Thank you,
Tony
