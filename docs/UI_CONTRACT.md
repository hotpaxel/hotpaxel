# Tiptex Web UI Contract (Phase 4)

> This document will be frozen before Phase 4 UI outsourcing starts.
> Do not implement UI decisions based on assumptions before freeze.

## HOT Public API usage patterns
- (TBD) HotManager init/load/update/getTex/renderPdf usage

## HTML contract
- (TBD) Allowed HTML structure produced by editor
- (TBD) Disallowed patterns / known breakages

## Protected tokens (must round-trip)
- `{% if %}`, `{% for %}`, `{{ variable }}`
- `\SignBox`, `\ClauseRef`, `\Party`, `\makyesignmeta`

## Failure UX policy
- (TBD) FailureState banner, allowed user actions, recovery behavior
