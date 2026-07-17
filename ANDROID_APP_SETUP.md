# Packaging the Member PWA as an Android App

This app is already a fully working PWA (manifest, service worker, icons all
in place). This document is the exact path from "PWA" to "installable
Android app on the Play Store," using **Bubblewrap** (Google's official CLI
for wrapping a PWA in a Trusted Web Activity — a thin native shell that
opens your PWA full-screen, no browser address bar).

I could not run any of this myself — it needs a real deployed HTTPS domain,
the Android SDK/JDK, and a signing keystore that only you should generate
and hold. What I *did* do: pre-filled `twa-manifest.json` and the
`assetlinks.json` placeholder at the correct paths, so once you're deployed,
this is mostly "fill in two values and run three commands."

## Before you start — non-negotiable requirements

1. **A real HTTPS domain.** Bubblewrap cannot point at `localhost` or an IP.
   `twa-manifest.json` currently assumes `member.mutan-coop.ng` — change
   `host`, `iconUrl`, `maskableIconUrl`, and `webManifestUrl` in that file to
   wherever this app actually ends up deployed.
2. **Node.js 16+**, already a given since this is a Next.js project.
3. **JDK + Android SDK** — Bubblewrap downloads these for you on first run
   if you don't have them. This takes a while the first time.

## Step 1 — Update the placeholders

In `twa-manifest.json` at the project root, change every occurrence of
`member.mutan-coop.ng` to your real domain. Also double check `packageId`
(`ng.mutan.member`) — this is permanent once published to the Play Store,
so settle on it now rather than after launch.

## Step 2 — Install Bubblewrap and build

```bash
npm install -g @bubblewrap/cli

# Run from this project's root, where twa-manifest.json lives
bubblewrap build
```

The first time you run this, Bubblewrap will ask you to generate a signing
key (a `.keystore` file) — keep it, back it up somewhere durable, and never
lose it. Every future update to this app must be signed with this exact
same key. Lose it, and you cannot update the published app — you'd have to
publish an entirely new listing with a new package ID, and every member
would have to uninstall and reinstall from scratch.

This produces two files: `app-release-signed.apk` and
`app-release-bundle.aab`.

## Step 3 — Prove domain ownership (Digital Asset Links)

After the build, Bubblewrap prints a SHA256 fingerprint for your new
keystore. Copy it into `public/.well-known/assetlinks.json` (already
scaffolded at that exact path in this repo), replacing the placeholder
string. Then deploy this app so that file is reachable at:

```
https://your-domain/.well-known/assetlinks.json
```

This is what lets Android remove the browser UI entirely and show your app
as fully native — without it, members would see address bar chrome at the
top of the app, which defeats the point.

## Step 4 — Test before publishing

```bash
bubblewrap install   # installs the signed APK on a connected device/emulator
```

Confirm: app opens full-screen with no browser bar, the dashboard loads,
login works, and Pay Direct's Paystack popup renders correctly inside the
TWA shell (this is worth testing specifically — some TWA configurations can
clip third-party popups, so verify on a real device before publishing).

## Step 5 — Publish

- **Play Store** (recommended for this audience): create a Google Play
  Developer account ($25 one-time), create a new app listing, and upload
  `app-release-bundle.aab` (the `.aab`, not the `.apk` — Play Store requires
  App Bundles). Review typically takes a few days. Once live, members just
  search "MUTAN" on the Play Store like any other app.
- **Direct distribution**: host `app-release-signed.apk` anywhere (e.g. a
  link on your own site or shared via WhatsApp) and have members download
  and tap to install. They'll see an "install from unknown sources" prompt
  once — worth a one-line instruction image since it can read as alarming
  to a non-technical user the first time.

## Updating the app later

```bash
bubblewrap update   # pulls in any manifest.json changes
bubblewrap build    # rebuilds, signing with the SAME keystore
```

Then re-upload the new `.aab` to Play Console as a new release. The
`appVersionCode` in `twa-manifest.json` needs to increment on every release
Google will accept (Bubblewrap does this automatically when you run
`update` unless you pass `--skipVersionUpgrade`).
