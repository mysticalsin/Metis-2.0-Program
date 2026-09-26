# Draft — request for Mantu sign-off on the Métis public repository (NOT SENT)

To: <Mantu legal / IP owner — to be chosen by Tony>
Cc: <Mantu IT owner of the GitHub budget request, if relevant>
Subject: Sign-off needed: Métis source repository is now public (licence, ownership, brand use)

Hello,

The source repository of Métis, the meeting copilot I build for Mantu (github.com/mysticalsin/AskToto-Mantu), was made public on 26 September 2026 so that its automated tests can run on GitHub's free CI. Before it stays public, I need Mantu's written position on three points:

1. **Ownership and licence.** The repository's LICENSE file is MIT with "Copyright (c) 2026 Tony Walteur". If Mantu owns the code, the copyright line and the licence choice should reflect that — or the repository should return to private.
2. **Brand use.** The app bundles Mantu Group names and marks (logo, wordmark, product copy). An MIT licence grants no trademark rights, but a notice excluding the Mantu marks from the licence is advisable if the code stays public.
3. **Earlier design research.** Some early internal notes about a competing product's user interface existed in the repository history; they have been removed from the repository's branches and tags, and GitHub Support will be asked to purge the copies it still caches. I would like legal's view on whether anything further is needed.

Security status: no credentials were found in the repository history. One installer attached to an old release embedded an API key; that file was deleted the same day and the key must be revoked with the vendor.

Options I see: (a) keep public with a Mantu copyright line, MIT licence and a trademark exclusion; (b) return the repository to private and fund GitHub Actions minutes through Mantu (request already drafted in docs/MANTU-IT-REQUEST.md); (c) publish only a sanitised copy later as a new repository.

Could you confirm which option Mantu approves, and who should sign off?

Thank you,
Tony
