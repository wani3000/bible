# iOS TestFlight Checklist (aptgugu)

Last updated: 2026-02-19

## 1) Local Preflight

Run from project root:

```bash
npm ci
npm run ios:testflight:prep
```

Expected:
- unit tests pass
- Next build succeeds
- Capacitor sync completes

## 2) Version / Build (already set)

- `MARKETING_VERSION`: `1.1.0`
- `CURRENT_PROJECT_VERSION`: `3`
- Bundle ID: `com.aptgugu.calculator`
- Deployment target: iOS 15.0

If you submit another build, increase `CURRENT_PROJECT_VERSION` by 1.

## 3) Open Xcode

```bash
npm run ios:open
```

Then in Xcode:
- Target: `aptgugu`
- Signing: Automatic
- Team: `3Q34V4BH5D`
- Device: `Any iOS Device (arm64)`

## 4) Archive and Upload

1. `Product > Archive`
2. In Organizer, choose latest archive
3. `Distribute App > App Store Connect > Upload`
4. Keep defaults unless Apple warnings indicate otherwise

## 5) App Store Connect

- TestFlight build processing completion
- Internal testers assignment
- External test requires Beta App Review

## 6) Common Failure Checks

- Build number duplicated: bump `CURRENT_PROJECT_VERSION`
- Signing/provisioning issue: reselect Team and Bundle ID in Xcode
- Missing icon/screenshot metadata: complete in App Store Connect
- JS not updated in app: rerun `npm run ios:sync`

