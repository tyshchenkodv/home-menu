# Product scope

## Purpose

Home Menu tracks what food exists at home and what can be prepared from current
ingredient inventory.

The administrator maintains the kitchen state: dishes, recipes, ingredient
stock, cooking requests, and prepared batches. A household member sees only
available dishes and requests portions for a specific date, meal, and time.

## Roles

### Administrator

The administrator can perform all regular user actions and can also:

- create, edit, and archive dishes;
- define the ingredients required for one standard cooking batch;
- create ingredients and maintain their current stock;
- inspect the immutable inventory movement log;
- approve, reject, and process cooking requests;
- register prepared batches and their actual portion yield;
- discard prepared food;
- correct orders when necessary;
- configure default breakfast, lunch, and dinner times.

### User

A user can:

- browse dishes available for a date and meal type;
- reserve prepared portions;
- create a cooking request;
- inspect active and completed orders;
- cancel an order while its state and scheduled time allow it;
- choose Ukrainian or English for their local UI.

## Domain vocabulary

| Term | Meaning |
| --- | --- |
| Dish | A catalog entry with a name, description, meal types, and recipe |
| Ingredient | A product or resource tracked in household inventory |
| Recipe | Ingredients required for one standard cooking batch |
| Prepared batch | The result of one cooking event with an actual portion yield |
| Prepared portion | One reservable unit from a prepared batch |
| Order | A request for portions at a scheduled date and time |
| Cooking request | An order that requires new food to be prepared |
| Inventory movement | An append-only stock addition, deduction, or correction |

## Availability states

Availability is derived from current data and is never maintained as a manual
flag:

- **Ready now:** one or more unreserved prepared portions exist.
- **Can be cooked:** inventory satisfies the full standard-batch recipe.
- **Unavailable:** there are no prepared portions and the recipe cannot be
  fulfilled.
- **Not configured:** the dish has no recipe and cannot be ordered or prepared.

Running out of an ingredient prevents new cooking but does not hide already
prepared portions.

## Menu behavior

The application does not require the administrator to publish a daily menu.
For the selected date and meal type, it automatically displays every
non-archived dish that:

- supports the selected meal type;
- has a non-empty recipe; and
- has prepared portions or can be cooked.

A dish may support more than one of `breakfast`, `lunch`, and `dinner`.

## Product constraints

- The application is online-only.
- Mobile layout is the primary design target.
- All timestamps are stored in UTC and displayed in `Europe/Kyiv`.
- Ukrainian (`uk`) is the default UI language; English (`en`) is the fallback.
- Language preference is local to the browser and does not affect domain data.
- Firestore changes appear in real time.
- Inventory and reservation mutations must be atomic.
- Historical entities are archived, not physically deleted.
- Expired prepared batches remain orderable but display a warning until an
  administrator discards them.

## Out of scope for the MVP

- payments;
- multiple isolated households in one Firebase project;
- public self-registration;
- email and push notifications;
- dish image uploads;
- automatic expired-food disposal;
- Cloud Functions and scheduled jobs;
- offline writes;
- automated backups;
- nutrition analytics and shopping lists.

## Open-source distribution

The repository is a reusable application template. It must not contain a
maintainer's Firebase configuration values, user identities, real household
inventory, or production exports. Each adopter provisions their own Firebase
project and users.
