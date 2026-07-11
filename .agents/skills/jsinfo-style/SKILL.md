---
name: jsinfo-style
description: Code-formatting and readability conventions from javascript.info ("Coding Style"). Use when writing, refactoring, or reviewing JavaScript/TypeScript for layout, braces, spacing, nesting, and function placement. Complements goodbilling-es-style (which governs naming and arrow vs function).
---

# JavaScript.info coding style

Layout/readability rules adapted from https://javascript.info/coding-style. Biome handles most of this automatically — this skill exists so reviewers can flag the cases Biome does not enforce (early returns, nesting depth, function placement, comment quality). For naming and arrow-vs-`function`, see [[goodbilling-es-style]].

## Braces & layout

- **Always use braces** — for **every** `if`, `else`, `for`, `while`, `do`, and guard clause, even a single-statement body. No brace-less `if (x) doThing();` and no brace-less `if (cond) return;`.
- **Egyptian (K&R) braces** — opening brace on the same line as the statement, `else`/`catch` on the same line as the closing brace.

```ts
// GOOD
if (isReady) {
  start();
} else {
  wait();
}

for (const vob of vobs) {
  process(vob);
}

// BAD — no braces
if (isReady) start();
if (!vob) return;
while (hasNext) advance();
```

## Spacing

- Space between operators and around keywords: `for (let i = 0; ...)`, `if (a > b)`, `x = a + b`.
- A blank line between logical "paragraphs" — group related steps and separate each **new logical construction** from the previous one. Don't let a function be one undivided wall of statements.
- **Blank line before and after a block statement** (`if`, `for`, `while`, `do`, `switch`, `try`) when it follows or precedes other statements. The block is its own paragraph — separate it from the surrounding code (e.g. a variable assignment and the `if`/`for` that consumes it), including in repeated assign-then-block sequences.
- **Blank line before a function** — declarations and definitions (including a returned/exported arrow-`const` function) get a blank line separating them from the preceding code.
- No more than one consecutive blank line.

```ts
// BAD — assignment glued to the block that uses it
const cptCodes = AppCrudUtils.splitCsvFilter(resolve(req, 'cptCode'));
if (cptCodes.length > 0) {
  qb.andWhere('... IN (:...cptCodes)', { cptCodes });
}
const rows = await load();
for (const row of rows) {
  process(row);
}

// GOOD — blank line separates each block from surrounding statements
const cptCodes = AppCrudUtils.splitCsvFilter(resolve(req, 'cptCode'));

if (cptCodes.length > 0) {
  qb.andWhere('... IN (:...cptCodes)', { cptCodes });
}

const rows = await load();

for (const row of rows) {
  process(row);
}
```

## Line length & nesting

- Keep lines readable (~100–120 chars); break long chains/conditions across lines.
- **Reduce nesting with early returns / `continue`.** Prefer guard clauses over deep `if` pyramids.

```ts
// BAD — nested
const handle = (vob) => {
  if (vob) {
    if (vob.isActive) {
      process(vob);
    }
  }
};

// GOOD — early returns (guard clauses still get braces)
const handle = (vob) => {
  if (!vob) {
    return;
  }

  if (!vob.isActive) {
    return;
  }

  process(vob);
};
```

## Function parameters

- **More than 3 parameters → take a single options object.** Once a function (or constructor, or static factory) needs 4+ arguments, replace the positional list with one named-parameter object so call sites are self-documenting and argument order stops mattering.

```ts
// BAD — 4 positional args; call sites are an unreadable tuple
static create(vobId: string, correlationId: string, diContainer: DiContainer, options?: Options) { ... }
create('vob-1', 'corr-1', container, { throwOnMissingCodes: false });

// GOOD — one params object
type CreateParams = { vobId: string; correlationId: string; diContainer: DiContainer; options?: Options };
static create(params: CreateParams) { ... }
create({ vobId: 'vob-1', correlationId: 'corr-1', diContainer: container, options: { throwOnMissingCodes: false } });
```

- 3 or fewer params can stay positional. Don't object-wrap a 2-arg function just for uniformity.

## Function placement

- Declare helper functions **after** the code that uses them when it reads top-down (the "what" before the "how"). Within a module, keep the high-level flow readable first, with small helpers below — as long as it does not fight the project's arrow-`const` + no-hoisting rule from [[goodbilling-es-style]].
- Keep functions small and single-purpose; if a function needs section comments to be understood, split it.

## Comments

**Default to no comment.** A comment earns its place only when the code cannot be made
self-explanatory by better names, and a reader would otherwise be surprised or misled. Prefer
renaming a variable/function over adding a comment that explains it. Fewer, load-bearing comments
beat a comment on every block.

- **Comment only the non-obvious:** *why* a choice was made, a non-local constraint or invariant, a
  gotcha/edge case, a workaround with its reason, or an intentionally surprising decision (e.g. "skip
  the event on purpose because …"). If a new reader would ask "why is this here / why this way?", answer that.
- **Never restate the code in prose.** Do not paraphrase a variable, service, method, or type name,
  and do not narrate *what* an obvious line does. If the comment is just the identifier reworded, delete it.
  - ❌ `// TypeORM column transformer that normalizes member ids on write` above `memberIdColumnTransformer`
  - ❌ `// deactivate the dirty duplicate` above `save({ status: Inactive })` — the code already says that
  - ✅ `// direct save skips PolicyStatusChangedEvent — these dup rows carry no VOBs, so re-eval would be noise`
- A block that needs a "section header" comment to be followed is a sign to **split the function**, not to annotate it.
- Comments explain **why**, not **what** the code literally does. Don't narrate obvious lines.
- Remove commented-out code; rely on git history.

## Relation to project tooling

- **Biome is the source of truth** for indentation, semicolons, quote style, trailing commas, and most spacing — run `npm run lint` and do not hand-fight it.
- **Braces (`useBlockStatements`) and no-useless-`else` (`noUselessElse`) are Biome-enforced** (shared root `biome.json`, `error` everywhere) and auto-fixed — do not rely on review for them.
- **Blank-line spacing is NOT Biome-enforceable and stays a reviewer/AI rule.** There is no Biome rule for "blank line before a block / function / logical paragraph", and the formatter never *inserts* blank lines (it only collapses extra ones). Enforce the blank-line conventions above by hand and in review. (ESLint's `padding-line-between-statements` is the only mechanical option, and `CLAUDE.md` bans ESLint.)
- This skill also covers the other human-judgment items Biome can't auto-fix: guard-clause nesting, comment quality, and function size/placement.
