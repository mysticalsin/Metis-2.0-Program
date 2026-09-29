# Draft — request to the Entra tenant administrator and Microsoft 365 tenant roles (NOT SENT)

To: <Entra tenant administrator — role; Tony names the person. Teams admin and Azure subscription owner may be other people; forward as needed>
Subject: Métis 2.0: Entra app registration, Teams and Graph permissions, first needed by 2026-10-12

Hello,

Métis, the meeting copilot I build for Mantu, needs single sign-on and Teams integration in the Mantu tenant. All items are scoped to a pilot group, and I will not handle tenant secrets myself: client and tenant IDs go into the Operator vault.

| # | What I need | Needed by | Blocks (tickets) |
|---|---|---|---|
| B-17 | Register the Métis applications with the documented audiences and scopes, grant admin consent, and place the tenant and client IDs in the Operator vault | 2026-10-12 | M2-0121 |
| B-21 | Confirm the Teams app policy, Graph actual-start event eligibility, an Azure subscription, calling-media SDK approval, and the recording-status and derived-data restriction | 2026-10-19 | M2-0151 |
| B-22 | Provide an Azure subscription and obtain Microsoft application-hosted media approval (if declined, post-meeting transcripts ship instead: decision D-22) | 2026-10-19 | M2-0155 |
| B-31 | Allow custom app upload of the Métis Teams package for a pilot group (Teams admin center) | 2026-11-02 | M2-0152 |
| B-32 | Grant the Métis service principal Graph permissions for calendar and online-meeting change notifications, in the pilot scope only | 2026-11-02 | M2-0153 |
| B-43 | Provide a permitted Teams test meeting and two test identities | 2026-11-16 | M2-0176 |

Also needed for the memory live proof (B-36, M2-0138, by 2026-11-05): two synthetic test identities.

Until then the product shows live SSO and live Teams media as BLOCKED, with a mock issuer in tests.

Could you tell me which of these you own, and who owns the rest?

Thank you,
Tony
