# Lighthouse CI — GitHub Actions wiring (deferred until remote exists)

When `hikmahtech/drwho` goes live, add this job to `.github/workflows/ci.yml`:

```yaml
  lighthouse:
    runs-on: ubuntu-latest
    needs: check
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lh
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: lighthouse-report
          path: .lighthouseci/
          retention-days: 14
```

Branch protection on `main`: require the `lighthouse` status check to pass.

This is a no-op until the remote exists. LHCI against `pnpm start` works locally, and that's the gate we use until deploy.
