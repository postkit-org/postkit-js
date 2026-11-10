# Boards

Every board on the Postkit canvas's Site and Components pages, with its route and the ticket that builds it. The Directions page (early explorations) isn't included.

- `mockups/` holds the source boards (`.dc.html`) plus `canvas.json`.
- `previews/` holds openable HTML. Open any file in a browser; `dc-viewer.js` runs the board's interactive logic, such as the Callout tone and variant controls and the Home renderer switch.
- `renders/` (in the separate renders zip) holds a full-page JPEG of each board.

**Rendered height** is the full page at the board's width. The renders use Inter (Google Fonts couldn't be reached here) instead of Inter Tight, and the real site uses Suisse Int'l, so treat heights as approximate. Share images and the phone search and menu boards are fixed-size frames; their renders include the empty viewport below.

81 boards.

## Site page

| Board | Title | Frame (w×h) | Rendered height | Route / use | Ticket |
|---|---|---|---|---|---|
| `PhoneHome` | Phone · Home | 390×10500 | 10470 | / | PK-030 |
| `SiteHome` | Home | 1440×7900 | 7861 | / | PK-030 |
| `SiteComponents` | Components | 1440×6600 | 6522 | /components | PK-031 |
| `SiteComponentCallout` | Component · Callout | 1440×5400 | 5380 | /components/callout | PK-032–034 |
| `SiteDocsQuickStart` | Docs · Quick start | 1440×3800 | 3804 | /docs/quick-start | PK-035 |
| `PhoneComponents` | Phone · Components | 390×8100 | 8059 | /components | PK-031 |
| `PhoneComponentCallout` | Phone · Callout | 390×8000 | 7335 | /components/callout | PK-032–034 |
| `PhoneDocsQuickStart` | Phone · Quick start | 390×6400 | 5074 | /docs/quick-start | PK-035 |
| `SiteComponentKeyTakeaway` | Component · KeyTakeaway | 1440×6400 | 6300 | /components/key-takeaway | PK-032–034 |
| `SiteComponentCodeBlock` | Component · CodeBlock | 1440×7200 | 7080 | /components/code-block | PK-032–034 |
| `SiteComponentFigure` | Component · Figure | 1440×7300 | 7186 | /components/figure | PK-032–034 |
| `PhoneComponentKeyTakeaway` | Phone · Component · KeyTakeaway | 390×9100 | 8984 | /components/key-takeaway | PK-032–034 |
| `PhoneComponentCodeBlock` | Phone · Component · CodeBlock | 390×10800 | 10695 | /components/code-block | PK-032–034 |
| `PhoneComponentFigure` | Phone · Component · Figure | 390×10600 | 10559 | /components/figure | PK-032–034 |
| `SiteArticle` | Notes · Article with sidenotes | 1440×4300 | 4259 | /notes/one-article-four-renderers | PK-037 |
| `PhoneArticle` | Phone · Article with end notes | 390×5400 | 5343 | /notes/one-article-four-renderers | PK-037 |
| `SiteDocsIntro` | Docs · Introduction | 1440×3200 | 3156 | /docs/introduction | PK-035 |
| `PhoneDocsIntro` | Phone · Docs · Introduction | 390×4700 | 4679 | /docs/introduction | PK-035 |
| `SiteDocsPartStyles` | Docs · Part styles | 1440×4500 | 4444 | /docs/part-styles | PK-035 |
| `PhoneDocsPartStyles` | Phone · Docs · Part styles | 390×5700 | 5685 | /docs/part-styles | PK-035 |
| `SiteDocsEmail` | Docs · Email | 1440×3700 | 3582 | /docs/email | PK-035 |
| `PhoneDocsEmail` | Phone · Docs · Email | 390×4600 | 4573 | /docs/email | PK-035 |
| `SiteDocsNext` | Docs · Next.js | 1440×3500 | 3337 | /docs/nextjs | PK-035 |
| `PhoneDocsNext` | Phone · Docs · Next.js | 390×4600 | 4529 | /docs/nextjs | PK-035 |
| `SiteDocsCLI` | Docs · CLI | 1440×3300 | 3262 | /docs/cli | PK-035 |
| `PhoneDocsCLI` | Phone · Docs · CLI | 390×4000 | 3968 | /docs/cli | PK-035 |
| `SiteNotes` | Notes | 1440×2800 | 2756 | /notes | PK-036 |
| `PhoneNotes` | Phone · Notes | 390×3900 | 3773 | /notes | PK-036 |
| `SiteChangelog` | Changelog · index | 1440×2200 | 2086 | /changelog | PK-038 |
| `PhoneChangelog` | Phone · Changelog · index | 390×3300 | 3247 | /changelog | PK-038 |
| `SiteLicensing` | Licensing | 1440×2800 | 2744 | /licensing | PK-039 |
| `PhoneLicensing` | Phone · Licensing | 390×3500 | 3507 | /licensing | PK-039 |
| `SitePrivacy` | Privacy | 1440×1900 | 1796 | /privacy (plus the hosting-logs line in 09, "Copy changes since the boards") | PK-039 |
| `PhonePrivacy` | Phone · Privacy | 390×2400 | 2342 | /privacy (plus the hosting-logs line) | PK-039 |
| `SiteNotFound` | 404 | 1440×1600 | 1539 | /404 | PK-039 |
| `PhoneNotFound` | Phone · 404 | 390×1800 | 1736 | /404 | PK-039 |
| `SiteWithOSS` | Made with OSS | 1440×4000 | 3924 | /withoss | PK-039 |
| `PhoneWithOSS` | Phone · Made with OSS | 390×6600 | 6546 | /withoss | PK-039 |
| `SiteChangelog030` | Changelog · 0.3.0 | 1440×3200 | 3085 | /changelog/0-3-0 | PK-038 |
| `PhoneChangelog030` | Phone · Changelog · 0.3.0 | 390×4400 | 4301 | /changelog/0-3-0 | PK-038 |
| `SiteChangelog020` | Changelog · 0.2.0 | 1440×3600 | 3536 | /changelog/0-2-0 | PK-038 |
| `PhoneChangelog020` | Phone · Changelog · 0.2.0 | 390×5300 | 5243 | /changelog/0-2-0 | PK-038 |
| `SiteChangelog010` | Changelog · 0.1.0 | 1440×3100 | 2989 | /changelog/0-1-0 | PK-038 |
| `PhoneChangelog010` | Phone · Changelog · 0.1.0 | 390×4100 | 4035 | /changelog/0-1-0 | PK-038 |
| `SiteSearch` | Search · results | 1440×960 | 960 | search dialog | PK-041 |
| `SiteSearchEmpty` | Search · no results | 1440×960 | 960 | search dialog (no results) | PK-041 |
| `PhoneSearch` | Phone · Search · suggestions | 390×844 | 900 | search dialog | PK-041 |
| `PhoneMenuOpen` | Phone · Menu open | 390×844 | 900 | phone menu | PK-011 |
| `SiteSignupStates` | Sign-up form states | 1440×2200 | 2064 | form states for the `/notes` card and `/newsletter/subscribe` | PK-051 |
| `PhoneSignupStates` | Phone · Sign-up form states | 390×3700 | 3650 | form states for the `/notes` card and `/newsletter/subscribe` | PK-051 |
| `SiteConfirmed` | Subscription confirmed | 1440×1500 | 1464 | /newsletter/subscribe?status=confirmed | PK-051 |
| `PhoneConfirmed` | Phone · Subscription confirmed | 390×1800 | 1766 | /newsletter/subscribe?status=confirmed | PK-051 |
| `SiteConfirmExpired` | Confirm link expired | 1440×1500 | 1401 | /newsletter/subscribe?status=expired | PK-051 |
| `PhoneConfirmExpired` | Phone · Confirm link expired | 390×1700 | 1614 | /newsletter/subscribe?status=expired | PK-051 |
| `SiteUnsubscribed` | Unsubscribed | 1440×1500 | 1404 | `/newsletter/unsubscribe` (Done state; other states in 04 §1a. The board's note about Resend's hosted page is out of date) | PK-051 |
| `PhoneUnsubscribed` | Phone · Unsubscribed | 390×1800 | 1747 | `/newsletter/unsubscribe` (Done state) | PK-051 |
| `EmailConfirm` | Email · Confirm subscription | 680×700 | 900 | confirmation email | PK-052 |
| `EmailRelease` | Email · Release (0.2.0) | 680×1500 | 1456 | release email | PK-053 |
| `SiteInteractionStates` | Interaction states | 1440×2000 | 1936 | (all controls) | PK-014 |
| `SiteIcons` | Icons | 1440×900 | 900 | favicon, touch icons | PK-060 |
| `OgHome` | Share image · Home | 1200×630 | 900 | share image | PK-061 |
| `OgComponent` | Share image · Component | 1200×630 | 900 | share image | PK-061 |
| `OgDocs` | Share image · Docs page | 1200×630 | 900 | share image | PK-061 |
| `OgNote` | Share image · Note | 1200×630 | 900 | share image | PK-061 |
| `OgRelease` | Share image · Changelog entry | 1200×630 | 900 | share image | PK-061 |
| `SiteHomeDark` | Dark · Home | 1440×7900 | 7861 | / · dark | PK-030 |
| `PhoneHomeDark` | Dark · Phone · Home | 390×10500 | 10470 | / · dark | PK-030 |
| `SiteComponentCalloutDark` | Dark · Component · Callout | 1440×5400 | 5380 | /components/callout · dark | PK-032–034 |
| `SiteArticleDark` | Dark · Notes article | 1440×4300 | 4259 | /notes/one-article-four-renderers · dark | PK-037 |
| `PhoneArticleDark` | Dark · Phone · Notes article | 390×5400 | 5343 | /notes/one-article-four-renderers · dark | PK-037 |
| `SiteDocsPartStylesDark` | Dark · Docs · Part styles | 1440×4500 | 4444 | /docs/part-styles · dark | PK-035 |
| `SiteSearchDark` | Dark · Search | 1440×960 | 960 | search dialog · dark | PK-041 |
| `PhoneMenuOpenDark` | Dark · Phone · Menu open | 390×844 | 900 | phone menu · dark | PK-011 |
| `SiteColorTokens` | Colour tokens · light and dark | 1440×2300 | 2272 | (tokens) | PK-002, PK-013 |

## Components page (package designs)

| Board | Title | Frame (w×h) | Rendered height | Route / use | Ticket |
|---|---|---|---|---|---|
| `CompFoundations` | Foundations | 1440×2600 | 2287 | — | 03 §7 / package |
| `CompKitArticle` | Kit 1 · Article structure | 1440×5200 | 4664 | — | 03 §7 / package |
| `CompKitTechnical` | Kit 2 · Technical content | 1440×5600 | 4151 | — | 03 §7 / package |
| `CompKitMedia` | Kit 3 · Media | 1440×5600 | 4255 | — | 03 §7 / package |
| `CompFootnotes` | Kit 1 · Footnotes & sidenotes | 1440×6400 | 6373 | — | 03 §7 / package |
| `CompKitDiscovery` | Kit 4 · Discovery | 1440×5200 | 3684 | — | 03 §7 / package |
| `CompKitEngagePublish` | Kits 5–6 · Engagement & Publishing | 1440×6000 | 4290 | — | 03 §7 / package |
