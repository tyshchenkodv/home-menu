---
name: grill-me
description: Use when stress-testing a substantial Home Menu design after brainstorming and before specification, or when the user asks to be grilled, challenged, or interviewed about a plan or design.
---

# Grill Me

Resolve the design decision tree before writing a specification. Continue until
the user and agent share one explicit understanding and no blocking branch
remains.

## Rules

1. Ask exactly one question at a time.
2. Include your recommended answer and concise reasoning with every question.
3. Explore the repository instead of asking anything answerable from code,
   tests, current docs, historical SPEC/PLAN files, or configuration.
4. Resolve prerequisite decisions before dependent decisions.
5. Record each answer for the later SPEC; do not silently replace it with your
   preference.
6. When an answer changes an earlier assumption, revisit affected downstream
   decisions.
7. Do not begin SPEC, PLAN, or implementation while a blocking decision
   remains.

## Coverage

Scale the interview to actual risk. For a substantial task, traverse every
applicable branch:

- problem, users, and success criteria;
- in-scope and out-of-scope behavior;
- UX, accessibility, roles, and error states;
- domain rules, data ownership, defaults, and concurrency;
- Firebase schema, Rules, Auth, indexes, transactions, migration, and rollback;
- privacy, public-repository exposure, and logging;
- `uk` and `en` copy or locale behavior;
- compatibility, rollout, observability, tests, and current documentation.

Skip branches proven irrelevant by repository evidence. Do not ask ceremonial
questions merely to lengthen the interview.

## Question shape

Use this compact shape:

```text
Question: [one decision]

Recommendation: [one preferred answer] — [reason and trade-off].
```

Offer two or three concrete options only when they make the decision easier.
Do not bundle multiple decisions into one option set.

## Completion

Stop grilling only when:

- every blocking decision is answered;
- dependencies between answers are consistent;
- important trade-offs and non-goals are explicit;
- remaining questions are genuinely non-blocking and safe to record in SPEC.

Then summarize the resolved decisions briefly and hand them to
`creating-specifications`. The SPEC remains subject to its own explicit user
approval gate.
