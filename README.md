# SipBuddy 💧

A local-first Windows desktop companion and a separate React product website. The **Electron app** puts a transparent, click-through buddy over other applications. The website provides a browser demonstration; it cannot draw over your desktop.

[Download SipBuddy 1.0.0 for Windows x64](https://github.com/amanpundir2027-lgtm/Sipbuddy/releases/download/v1.0.0/SipBuddy-Setup-1.0.0.exe) · [Release notes](https://github.com/amanpundir2027-lgtm/Sipbuddy/releases/tag/v1.0.0). This is an unsigned installer; see the SmartScreen notes and Windows acceptance checklist below. The website production build is verified. GitHub Pages deployment is configured as the public sharing option; Vercel hosting still needs account authorization.

## Your original mascot

Your original transparent PNG is included at **`assets/aman-water-chibi.png`** (renamed byte-for-byte from `Refreshing Chibi Water Break.png`). The face is never generated or redesigned. Both apps use this single asset unchanged, with `object-fit: contain`. Motion translates, bobs, and gently rotates the entire image; it does not fake separate limbs or distort the bottle. Until the PNG is present, the UI shows an explicitly labeled water-drop placeholder. A public version-tag release refuses to proceed without the original PNG.

On GitHub, upload the image through **Add file → Upload files**; if it lands at the root, move it to `assets/aman-water-chibi.png`. Rebuild after adding it. Transparent alpha is required; a black background in an image viewer does not by itself prove the PNG has lost transparency.

## Develop

Use Node.js 24 and pnpm 11.25.0 (`npm install -g pnpm@11.25.0` if needed).

```sh
pnpm install --frozen-lockfile
pnpm dev                 # website
pnpm dev:desktop         # Electron dashboard + Vite
pnpm typecheck
pnpm test
pnpm build               # both production builds + main/preload bundles
pnpm exec playwright install --with-deps chromium
pnpm test:e2e
pnpm test:electron       # real Electron smoke; requires a graphical session
```

`pnpm dev:desktop` needs a graphical desktop. On Windows, no Wine or X server is needed. On Linux, a graphical session is required; a virtual X server is useful for smoke tests but does not verify Windows compositor behavior. When a compatible Chromium is preinstalled, use `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium pnpm test:e2e` instead of downloading another browser.

In proxy-managed cloud environments, Node 24 downloads may require `NODE_USE_ENV_PROXY=1`. Use writable XDG cache/data paths if the home directory is unavailable. Keep TLS and artifact checksum verification enabled. Each cloud task is already isolated: use this checkout, without creating worktrees.

## Desktop behavior

- Main-process 30-minute default scheduler; configurable 1–1440 minutes, with common presets.
- Quiet hours default to 22:00–08:00 **in the machine's local timezone**. Equal start/end means quiet all day.
- Closing the dashboard keeps the tray and scheduler alive. Use **Quit SipBuddy** to exit. First launch opens the dashboard; later launches respect the start-minimized preference. Double-click the tray icon to reopen it.
- **Test My Mascot Walk** triggers the real overlay immediately, including during quiet hours or a manual pause. It does not log water, count as a scheduled reminder, or change the next reminder time. Lock/suspend closes ongoing walks.
- Overlay windows use display work areas in Electron's device-independent coordinates. They are transparent, frameless, focusless, hidden from the taskbar, always on top, and ignore mouse input. The character starts fully outside the left edge and exits completely right in 23 seconds by default (10–60 seconds adjustable). Each window is destroyed after completion, with a safety timeout.
- Primary, chosen, or every connected display is supported. A disconnected monitor preference falls back to primary. Vertical position is clamped to the usable screen height.
- Lock, sleep, resume, backward clock changes, and gaps over 90 seconds rebase the next reminder. Restart preserves future snoozes and discards overdue backlogs. Paused or quiet reminders are deferred, never replayed in a burst.
- Full-screen presentations/games are **not automatically detected**. Pause from the tray before presenting or gaming. Exclusive full-screen applications and secure Windows desktops may prevent overlays.
- Optional sound is the operating system's notification beep, disabled by default; its volume follows system settings.
- Optional autostart uses Electron's Windows login-item API. No administrator rights or additional OS permissions are required.

## Tracker and privacy

The editable 2,000 mL default is a personal starting point, **not medical advice**. Reminders encourage a break; they never assume a 250 mL drink. Quick-add 100/200/250/500 mL or a custom 1–5,000 mL entry. History, progress, weekly bars, reminder counts, and goal-based streaks use local calendar dates. Streaks use the currently configured goal.

Desktop preferences and history live in `sipbuddy-state.json` under Electron's `app.getPath('userData')` (normally `%APPDATA%/SipBuddy`). Writes use a temporary file and rename. If data cannot be parsed, its original content is copied to a timestamped `.recovery-*` file before a fresh state is created. Back up this directory for manual recovery or migration. Routine updates retain it; the NSIS configuration also leaves data intact during uninstall.

No desktop history leaves the machine. No accounts, analytics, subscriptions, or backend. The website's optional tracker demo stores a **separate** history in that browser's localStorage and is not synced to the desktop app.

## Windows installer and GitHub Releases

On Windows:

```sh
pnpm dist:win
```

Output: `apps/desktop/release/SipBuddy-Setup-1.0.0.exe` (64-bit, per-user NSIS installer with shortcuts and no required elevation). Update app versions together before a new release.

`.github/workflows/release.yml` builds on `windows-latest`. A manual run produces a downloadable workflow artifact (it may contain the labeled placeholder if the original PNG has not been added); pushing a version tag such as `v1.0.0` publishes the installer through `gh release create`, with `contents: write` scoped to that job. The tag must already exist remotely and the original mascot must be in the checkout. Review the Windows checks below **before tagging**.

Signing is not configured. An unsigned installer can display **Windows SmartScreen / unknown publisher** warnings. Do not describe this build as signed or tell users to ignore a warning without checking the source. A branded Windows executable icon is also not configured yet; the installer currently uses Electron's default app icon, while the system tray has its own water drop.

Linux cross-builds additionally need Wine. `electron-builder --win nsis --x64 --publish never -c.win.signAndEditExecutable=false` can avoid Windows resource editing for an unsigned cross-build, but Wine is still needed to generate the uninstaller. Prefer the Windows CI job for release artifacts.

## Public website hosting

GitHub Pages is configured through `.github/workflows/pages.yml`. It deploys `apps/web/dist` after relevant pushes to `main`, using the repository’s `github-pages` environment. Vite’s relative asset paths support the repository subpath. The public page includes the browser demo and verified Windows installer link; it does not provide OS overlays.

### Vercel

Import this GitHub repository into your Vercel project. Set **Root Directory = `apps/web`** and allow source files outside that directory (the `packages/*` workspace dependencies and `assets/*` are required). `apps/web/vercel.json` configures Vite, frozen pnpm installation, the workspace build, and `dist` output. No application secrets are needed.

Before the website builds, `scripts/verify-release.mjs` requests the latest public GitHub release and performs a successful HEAD request against the matching `SipBuddy-Setup-x.y.z.exe` asset. Only then does it generate an active download manifest. If the release is missing, inaccessible, or unverified, the page explicitly says **not released yet**, with a release-status link instead of a broken installer link. Redeploy Vercel after publishing a new installer. The build needs outbound `api.github.com`, `github.com`, and GitHub's release asset CDN. It intentionally does not copy GitHub tokens into browser code.

No Vercel deployment or GitHub Release should be considered published just because a local build passed. Actual publication requires working account permissions and verification of the returned deployment/release URL.

## Architecture and security

- `apps/desktop/electron`: main-process scheduling, tray, local store, secure preload, multi-display overlays.
- `apps/desktop/src`: settings/dashboard renderer and overlay renderer.
- `apps/web`: independent Vite website, browser preview, demo tracker.
- `packages/core`: validated commands, shared settings/types, local-date hydration logic and scheduling policy.
- `packages/ui`: reusable dashboard, original-PNG presentation, and translation animation.

Electron uses `contextIsolation`, sandboxed renderers, disabled `nodeIntegration`, a narrowly scoped preload, IPC validation, main-frame/sender checks, blocked navigation/popups/webviews, a local-content CSP, and denied permission requests. Overlay renderers cannot issue tracker/settings commands. All packaged renderer code and assets are local.

## Validation and Windows acceptance checklist

Automated tests cover interval presets, pause/resume, snoozes, local quiet-hour boundaries, clock and sleep scheduling, restart behavior, hydration dates/totals/streaks, message rotation, IPC input validation, and on-disk persistence/recovery. Playwright checks desktop/mobile layout, real browser movement, water logging, pause, settings, and reload persistence. CI runs type checking, tests, both builds, and browser checks.

The following need a real Windows session and must not be inferred from browser tests or Linux packaging:

- [ ] Install the generated `.exe`, launch, and check per-user shortcuts/uninstall.
- [ ] Confirm the **original** PNG renders with alpha and correct proportions.
- [ ] Activate Excel/Chrome and trigger Test Walk from the tray/dashboard.
- [ ] Confirm full left-to-right traversal, transparent background, no taskbar rectangle, and complete disappearance.
- [ ] Keep typing and clicking underneath; confirm no keyboard focus is stolen.
- [ ] Test 100%, 150%, and 200% DPI, negative-coordinate secondary monitors, and every-display mode.
- [ ] Verify tray persistence after dashboard close; verify Quit actually exits.
- [ ] Exercise quiet hours, pause/resume, snooze, sleep/wake, lock/unlock, and startup settings.
- [ ] Leave the app running through an automatic interval with the dashboard closed.
- [ ] Update over an installed build and verify water history survives.

## Troubleshooting

**No avatar:** check exact filename/case, add the real PNG, restart dev servers or rebuild. Placeholders are deliberately visible until then.

**No scheduled walk:** check tray pause, quiet hours, selected display, and countdown. Try Test Walk; it bypasses pause/quiet hours. A missed reminder after sleep is intentionally deferred.

**Dashboard disappeared:** closing it hides to tray. Double-click the tray droplet or launch SipBuddy again.

**Installer blocked:** unsigned builds may trigger SmartScreen. Verify the release source. Production signing requires a separately configured signing identity.

**Network denied:** frozen installs need npm and Electron download hosts. Playwright downloads need its CDN, or use the installed Chromium override. Git read access does not imply GitHub API/release-write access. Add missing allowlist domains through environment settings, then retry. Never disable TLS or checksum validation.
