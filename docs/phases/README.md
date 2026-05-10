# PureTask Protocol — README

This folder contains the operating protocol for Claude on the PureTask project. Four documents, each with a specific purpose.

## What's in this folder

### `puretask_operating_principles.md`
The main document. Defines how Claude operates on PureTask. Read first when starting work, re-read when triggered. ~250 lines, structured for fast reload.

**Where it goes:** Project knowledge in your Claude.ai project. This is the canonical version that every Claude conversation references.

### `CLAUDE_QUICK_REFERENCE.md`
One-page cheat sheet of the operating principles. The essentials only — trigger phrases, forbidden phrases, allowed pushback, project facts. Designed to be scannable in 30 seconds.

**Where it goes:** Project knowledge alongside the main principles doc. Useful when a Claude instance needs a fast refresher mid-conversation without re-reading the full principles.

### `SESSION_OPENING_TEMPLATE.md`
Templates Nathan uses to start new conversations. Short version, long version, recovery version, plus example openings.

**Where it goes:** Save somewhere Nathan can quickly access (his repo, a notes app, a snippet manager). Not in project knowledge — it's a tool for Nathan, not for Claude.

### `DRIFT_LOG.md`
A running log of times Claude slipped from the operating principles. Updated by Nathan. Patterns that repeat get added to the main principles doc.

**Where it goes:** Project knowledge so future Claude instances can see what's been observed. Also useful for Nathan when he's deciding whether to update the principles.

---

## How this all works together

```
Conversation starts
       ↓
Claude searches project knowledge
       ↓
Reads puretask_operating_principles.md (main doc)
       ↓
Operates in top 1% mode
       ↓
If Claude slips: Nathan uses trigger phrase
       ↓
Claude reloads principles, corrects, continues
       ↓
After session: Nathan logs drift in DRIFT_LOG.md if pattern is new
       ↓
Periodically: Nathan updates puretask_operating_principles.md to capture new patterns
```

---

## Setup checklist

To put this protocol into effect:

- [ ] Save `puretask_operating_principles.md` to project knowledge in Claude.ai
- [ ] Save `CLAUDE_QUICK_REFERENCE.md` to project knowledge in Claude.ai
- [ ] Save `DRIFT_LOG.md` to project knowledge in Claude.ai
- [ ] Save `SESSION_OPENING_TEMPLATE.md` somewhere Nathan can access (NOT project knowledge — it's for Nathan, not Claude)
- [ ] Test in next session: open new conversation with "Top 1%. Operating principles apply." and see if behavior matches
- [ ] First time Claude drifts, use a trigger phrase to verify it works
- [ ] After 2-3 sessions, check DRIFT_LOG and update principles doc if new patterns emerged

---

## Maintenance

The protocol is meant to evolve. Nathan should:

- Update the principles doc when new drift patterns are observed
- Refine trigger phrases if the current ones don't produce the expected behavior
- Add new sections to the principles if the project's needs change
- Keep the main doc tight — if it grows past ~400 lines, it's getting too long; refactor

This isn't a one-time setup. It's a living protocol that gets sharper with use.
