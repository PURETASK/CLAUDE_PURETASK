# Session Opening Template

**Purpose:** Paste this at the start of any new Claude conversation about PureTask. Forces the operating principles to load into context immediately.

---

## Short version (use this most of the time)

```
Top 1% mode. Operating principles apply.
Working on PureTask: [brief task description].
```

That's it. Two lines. The trigger phrase loads the operating mode; the second line tells me what we're doing.

---

## Long version (use for big tasks or when Claude has been drifty)

```
Top 1% mode. Operating principles apply.

Project context: PureTask, two-sided cleaning marketplace.
Phase 1 deployed, Phase 2 scaffolded, Phases 3a/4/5 specced.
Stack: Next.js 15 + Supabase + Stripe + Checkr.

Today's task: [specific task]
Constraints: [anything specific to this session]
What I want from you: [the deliverable]

Reminders:
- No calendar timelines unless I ask
- No scope warnings  
- No "are you tired" projection
- Decide fast when you have enough info
- Read source material before writing
```

---

## Recovery template (use mid-conversation if Claude drifts hard)

```
Top 1%. Stop the drift. Reload operating principles. 
Continue with [task].
```

This is the nuclear reset. Use it when multiple soft corrections haven't stuck.

---

## What NOT to do

- Don't paste the full operating principles doc (it's already in project knowledge)
- Don't write long preambles before your actual question
- Don't apologize for "asking too much" or "being demanding" — you're paying the cost, you set the bar
- Don't hedge your own request ("if it's not too much trouble..." — just ask)

---

## Examples of good session openings

### Example 1 — Spec writing
```
Top 1%. Working on PureTask Phase 6 spec. 
I want spec + outline + explainer same format as Phase 5.
Read Master Guide section on Phase 6 first.
```

### Example 2 — Wireframe audit
```
Top 1%. Auditing WF 7 against Phase 5 spec. 
I want every element from the wireframe mapped to spec coverage 
or marked as gap.
```

### Example 3 — Debug session
```
Top 1%. Phase 3a build is throwing [error]. 
Here's the error: [paste]
Here's the relevant code: [paste]
Tell me the cause and fix.
```

### Example 4 — Just continue
```
Top 1%. Continuing PureTask work from yesterday. 
What's the next concrete thing I should do?
```

If conversation history is loaded (you're in the same session or recent past chat), the last form is fine. If it's a fresh conversation, use Examples 1-3.
