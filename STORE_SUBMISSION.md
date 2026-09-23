# MANJI Studio — Microsoft Store Submission Guide

Status: packaging ready · submission needs a Partner Center account + publisher ID.

## What is already done (in this repo)

- `npm run build:store` → builds a signed-ready `.appx` via electron-builder
  (`--win appx` only; the normal NSIS/portable CI builds are untouched).
- Store tiles generated in `build/appx-assets/` from the Manji logo:
  StoreLogo, Square44x44, Square150x150, Wide310x150, SplashScreen.
- `package.json → build.appx` block with identity/display names and colors.
- `description` + `author` fields set (also silences electron-builder warnings).

## What YOU must do (Microsoft requires a human + $19)

### 1. Partner Center developer account (~15 mins, $19 one-time)
1. Go to https://partner.microsoft.com → **Developer** → sign in.
2. Enroll as an **individual** ($19 one-time). Verification can take a few hours.

### 2. Reserve the app name (free, do early — names are first-come)
1. Partner Center → **Apps and games** → **New product** → **MSIX or PWA app**.
2. Reserve **`MANJI Studio`** (fallback: `Manji Studio`, `MANJI Animation Studio`).
3. Note your **Publisher ID** (`CN=XXXX...`): Partner Center → **Account settings** →
   **Organization profile** (individual accounts show it under legal info).

### 3. Wire the publisher ID into the repo (takes effect on next Store build)
In `package.json → build.appx`, replace:
```
"publisher": "CN=REPLACE-WITH-PARTNER-CENTER-PUBLISHER-ID"
```
with your real `CN=...` value, commit, push. The `identityName`
(`MANJIStudio`) must also match what Partner Center assigned — update if
yours differs.

### 4. Build + sideload-test the package locally
```bash
cd Manji_Frontend
npm install
npm run build:store
```
Output: `release/MANJI-1.0.appx`. Install it on a clean Windows machine
(double-click → App Installer). Verify: launch, login, official story,
projects, AI, uploads.

> ⚠️ Known risk to verify in testing: the desktop app serves its UI over
> `http://127.0.0.1:51xx`. Packaged Win32 (Desktop Bridge) apps normally
> keep loopback access, unlike pure UWP — but confirm the app loads past
> the splash screen when sideloaded. If blocked, the fix is switching the
> local server to a named pipe or `file://` + hash routing (ask engineering).

### 5. Submission checklist (Partner Center → your product → Submissions)
- [ ] Upload `MANJI-1.0.appx` (Store signs it; you do **not** need your own cert).
- [ ] **Privacy policy URL** (required): publish one at `https://manji.io/privacy`
      (or any public URL) and paste the link.
- [ ] **Support/contact email**: support@manji.io.
- [ ] **Age rating**: complete the IARC questionnaire (creative tool with
      user-generated stories → expect 12+ / Teen equivalent; answer honestly).
- [ ] **Screenshots** (required, min 1 at 1366×768+): capture Home, Studio,
      Animation timeline, Official page from the installed app.
- [ ] **Description + features list**: reuse `download-site/index.html` copy.
- [ ] **Category**: Entertainment or Creativity → pick closest available.
- [ ] **Pricing**: Free.
- [ ] **Capabilities**: no special capabilities needed (no webcam/mic declarations
      unless voice recording is enabled at submission time — if it is, declare
      `microphone` and justify it in the notes).

### 6. Certification notes (avoid the common rejections)
- App must launch offline-tolerant: if the backend sleeps, show the loading
  state, not a crash (current behavior: spinner + retry — OK).
- No `localhost` hacks in submitted notes; testers run on vanilla Windows.
- Version in Store (`1.0.x`) should match in-app version to avoid confusion.
- Keep the NSIS/GitHub installer as the primary channel until Store approval
  lands (review takes 1–3 business days typically).

## After approval
- Add “Also on Microsoft Store” badge (link `ms-windows-store://pdp/?ProductId=<STORE_ID>`)
  to `download-site/index.html`.
- Future releases: tag as usual for GitHub installers; run `npm run build:store`
  and upload the new `.appx` as a Store submission update.
