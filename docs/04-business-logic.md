# Business rules

## Core invariants

1. A dish without a recipe cannot be ordered or cooked.
2. Missing ingredient stock prevents cooking but does not hide prepared food.
3. Dish availability changes automatically when inventory changes.
4. No inventory or batch counter may become negative.
5. A portion cannot be both available and reserved.
6. Recipe ingredients are deducted only when cooking is completed.
7. The administrator always enters the actual prepared portion yield.
8. Prepared food is allocated FIFO by `preparedAt`.
9. Historical records are archived rather than deleted.
10. A user reads and changes only their own orders.

## Building the menu

The user selects a date and `breakfast`, `lunch`, or `dinner`. The application:

1. loads non-archived dishes that support the selected meal;
2. excludes dishes with an empty recipe;
3. calculates prepared portions;
4. evaluates the standard recipe against current inventory;
5. displays a dish when it has prepared portions or can be cooked;
6. displays separate ready and cookable indicators.

The menu is derived automatically. The administrator does not publish a daily
schedule.

## Reserving prepared food

When enough prepared portions exist, `placeReadyOrder` runs a transaction:

1. re-read the dish and require a non-empty recipe;
2. read the oldest available batches;
3. verify that total `availableQuantity` is sufficient;
4. allocate the requested quantity FIFO;
5. decrement `availableQuantity` and increment `reservedQuantity`;
6. create an order with `reserved` status and allocations.

If the requested quantity exceeds prepared stock, the entire operation fails.
The system does not mix prepared portions and a cooking request in one order.
The user may create a separate cooking request.

## Cooking request lifecycle

```text
pending → approved → cooking → prepared
       ↘ rejected
       ↘ cancelled
```

- `pending`: waiting for an administrator decision.
- `approved`: accepted but not started.
- `cooking`: preparation started; the user can no longer cancel.
- `prepared`: ingredients were deducted, a batch was created, and requested
  portions were reserved.
- `rejected`: declined, optionally with a reason.
- `cancelled`: cancelled by the user before cooking began.

Approval does not reserve ingredients. Inventory is checked again before
starting and transactionally when completing cooking.

## Completing cooking

The administrator enters:

- actual portion yield;
- preparation date and time;
- optional expiration date and time.

One transaction:

1. requires the request to be in `cooking`;
2. re-reads every recipe ingredient;
3. verifies sufficient inventory;
4. verifies that actual yield covers the requested portions;
5. deducts recipe quantities;
6. creates append-only `cooking` inventory movements;
7. creates a prepared batch;
8. reserves the order quantity from that batch;
9. changes the request to `prepared`.

If actual yield is lower than the order quantity, the transaction fails. The
administrator must correct the request or enter the correct yield.

The administrator may also register cooking without a user request. The same
inventory transaction applies, `sourceCookingRequestId` is null, and the full
yield starts as available.

## Cancellation

### Prepared-food reservation

A user may cancel `reserved` while `now < scheduledFor`. A transaction restores
each allocation:

```text
reservedQuantity -= allocation.quantity
availableQuantity += allocation.quantity
```

The order becomes `cancelled`.

### Cooking request

A user may cancel `pending` or `approved`. Cancellation is forbidden from
`cooking` onward. The administrator may perform an audited correction.

## Automatic consumption

After `scheduledFor`, an uncancelled reservation is effectively `consumed`.
Because the MVP has no server scheduler:

- UI immediately derives the consumed status;
- the portions remain unavailable to other orders;
- a later administrator view or mutation may normalize persisted counters.

Normalization is idempotent:

```text
reservedQuantity -= quantity
consumedQuantity += quantity
order.status = consumed
```

It runs only while persisted status is `reserved` or `prepared`.

## Expiration

When `expiresAt < now`, the UI shows a translated warning to both roles. The
batch remains orderable by explicit product decision.

Only an administrator may discard its available remainder:

```text
discardedQuantity += availableQuantity
availableQuantity = 0
status = 'discarded'
```

`status` becomes `'discarded'` (distinct from `'depleted'`, which marks a
batch whose stock ran out through ordinary reservation/consumption). The UI
(`BatchCard`, `OrderCard`) reads `status === 'discarded'` directly.

Reserved portions are not automatically discarded.

## Inventory movements

- `restock`: add quantity or set a presence item.
- `correction`: set actual stock and require an explanatory note.
- `cooking`: deduct the standard recipe during completion.
- `archive_adjustment`: optional final correction before archiving.

Each command updates the ingredient and appends a movement in one transaction.

## Concurrency

Two clients may render the same available portion. Firestore transaction retries
ensure that only one reservation commits. The other command receives a domain
error and refreshes its view.

## Localization boundary

Business rules use stable English enum values and error codes. Domain functions
never return Ukrainian or English prose. Presentation maps those codes to
i18next keys, which keeps rules testable and locale-independent.
