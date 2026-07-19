# Privacy Policy for AO3 Toybox

**Last updated:** July 18, 2026

AO3 Toybox ("the extension") is a browser extension that adds tag highlighting, work filtering, theming, reading-progress tracking, and an improved reading view to [Archive of Our Own](https://archiveofourown.org) (AO3). This policy explains what the extension does and does not do with your information.

## The short version

**AO3 Toybox does not collect, transmit, sell, or share any of your data.** Everything the extension saves — your settings, tag colors and rules, and reading history — is stored locally in your own browser and never leaves your device. There are no servers, no accounts, no analytics, and no third parties involved.

## What the extension stores

To provide its features, AO3 Toybox saves the following on your device, in your browser's local extension storage (IndexedDB):

- **Settings and preferences** — your chosen theme, reading-view settings (font, size, width, spacing), work-filtering rules, progress-bar options, and feature toggles.
- **Tag configurations** — the colors, fade/hide rules, and regular-expression patterns you set up for tags.
- **Reading history** — which AO3 works you've visited, how far you've read (chapter and paragraph position), your visited/subscribed/ignored states, and fresh-chapter tracking.
- **Reading speed** — the words-per-minute value you set or measure with the built-in speed test, used to calculate reading-time estimates.

All of this data stays on your device. None of it is uploaded, synced to a remote server, or otherwise sent anywhere.

## What the extension does NOT do

- It does **not** collect or transmit any personal or usage data to the developer or anyone else.
- It does **not** use analytics, telemetry, tracking pixels, or advertising of any kind.
- It does **not** sell, rent, or share your data with third parties.
- It does **not** require an account, login, email address, or any personal identifier.
- It does **not** run on any website other than AO3 (see "Permissions" below).

## How the extension reads AO3 pages

To highlight tags, filter works, apply the theme, and track your reading progress, the extension reads the content of the AO3 pages you visit (for example, tags, work statistics, and chapter information). This processing happens entirely within your browser, on your device. Nothing that the extension reads from a page is sent to any external server.

## Permissions the extension requests, and why

AO3 Toybox is built on Manifest V3 and requests the minimum permissions needed to function:

- **`storage` and `unlimitedStorage`** — to save your settings, tags, and reading history locally, without running into small storage limits as your reading history grows.
- **Host access to AO3 domains only** — the extension's content scripts run only on the AO3 domains listed below, so it can modify those pages and record your reading progress. It has no access to any other website you visit.

The AO3 domains the extension runs on are:

- `archiveofourown.org`
- `archiveofourown.com`
- `archiveofourown.net`
- `ao3.org`
- `archive.transformativeworks.org`

(and their subdomains)

## Your control over your data

- **It's yours and it's local.** Your data remains on your device until you remove it.
- **Import / Export.** The extension's Import / Export screen lets you back up your tags and settings, or move them to another browser, entirely by your own action.
- **Deletion.** You can clear the extension's data at any time from within the extension or your browser's settings. Uninstalling the extension removes the data it stored.

## Third-party services

AO3 Toybox does not integrate with any third-party services and sends your data to no one.

Note that AO3 itself is operated by the Organization for Transformative Works and has its own separate privacy practices, which govern your use of the AO3 website. This policy covers only the AO3 Toybox extension.

## Children's privacy

AO3 Toybox is a general-purpose browsing enhancement and is not directed at children. It does not knowingly collect any information from anyone, including children, because it does not collect information at all.

## Open source and verifiability

AO3 Toybox is open source and released under the GNU Affero General Public License v3.0. The full source code is publicly available, so anyone can inspect it and verify the claims in this policy:

https://github.com/Eden7600/ao3-toybox

## Changes to this policy

If this policy changes, the updated version will be posted at the same location as this document, with a revised "Last updated" date. Continued use of the extension after a change constitutes acceptance of the updated policy.

## Contact

Questions or concerns about this policy or the extension's privacy practices can be raised via the project's issue tracker:

https://github.com/Eden7600/ao3-toybox/issues

Or by emailing the developer at:

eden7600cws@gmail.com
eden7600@pm.me
