## Proposed changes

<!-- Describe the big picture of your changes here to communicate to the maintainers why we should accept this pull request. -->

## Fixes

<!-- If it fixes a bug or resolves a feature request, be sure to link to that issue. -->

## Types of changes

What types of changes does your code introduce?
_Put an `x` in the boxes that apply_

- [ ] Bugfix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)

## Supply-chain checklist

_Required when this PR changes [package.json](../package.json), [yarn.lock](../yarn.lock), or anything under [.github/workflows/](../.github/workflows/) or [.supply-chain/](../.supply-chain/). See [SUPPLY-CHAIN-SECURITY.md](../SUPPLY-CHAIN-SECURITY.md)._

- [ ] No new direct dependency added — _or_ the new dep was reviewed per [SUPPLY-CHAIN-SECURITY.md §9](../SUPPLY-CHAIN-SECURITY.md#9-dependency-review-on-every-new-addition) (download count, repo activity, maintainer history, postinstall scripts).
- [ ] All version specifiers in [package.json](../package.json) are exact (no `^`, `~`, `>=`); same for any new entries under `resolutions`. See [§1](../SUPPLY-CHAIN-SECURITY.md#1-exact-version-pinning-in-all-packagejson-files).
- [ ] If [yarn.lock](../yarn.lock) changed, the diff is proportionate to the `package.json` change and contains no unfamiliar packages, typo-squats, or non-`registry.{yarnpkg,npmjs}.org` URLs. See [§4](../SUPPLY-CHAIN-SECURITY.md#4-lockfile-review-in-prs).
- [ ] If a dep was added or bumped, the target version is **at least 7 days old** (cooldown per [§5](../SUPPLY-CHAIN-SECURITY.md#5-cooldown-window-on-updates)) — _or_ the bump is for a disclosed CVE (note the advisory ID below).
- [ ] If a new package landed with a `pre/post/install` script, the install-hook allowlist was regenerated (`yarn audit:install-hooks:update`) and the diff is committed. See [§7](../SUPPLY-CHAIN-SECURITY.md#7-avoid-postinstall-heavy-dependencies).
- [ ] All three supply-chain gates pass locally: `yarn supply-chain` (runs `audit:prod` + `lint:lockfile` + `audit:install-hooks`).
- [ ] If a new GitHub Action was referenced from a workflow, it is pinned to a commit SHA (not a floating `@v*` tag).
