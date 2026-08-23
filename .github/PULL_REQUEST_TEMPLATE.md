## Description

<!-- What does this PR change and why? Link the issue it resolves. -->

## Checklist

- [ ] CI gates pass locally: `pnpm run typecheck && pnpm run typecheck:ci && pnpm test && pnpm run build && pnpm run verify:self-contained && pnpm run verify:artifacts && pnpm pack`
- [ ] Tests added or updated for the new behavior
- [ ] `CHANGELOG.md` updated
- [ ] Five-language READMEs kept in sync (`pnpm run check:readmes`); English is the source of truth
- [ ] Linked issue: closes #<number> (or "None" for a self-contained change)
- [ ] No secrets, tokens, keys, or Authorization headers in this PR — placeholders only
