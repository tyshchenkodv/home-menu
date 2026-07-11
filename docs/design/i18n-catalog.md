# Screen translation-key catalog

This catalog is the implementation-neutral source list for the screen
transcriptions in `docs/design/screens/`. Ukrainian (`uk`) is the default
locale and English (`en`) is the fallback. `ua` is never a locale code; `UA`
below is display copy only.

## Namespacing convention

Use feature-based, lower-camel-case paths matching the existing locale files.
Screen copy belongs to `auth.*`, `menu.*`, `orders.*`, `requests.*`,
`dashboard.*`, `batches.*`, `dishes.*`, `inventory.*`, or `settings.*`.
Reusable actions, data states, meal labels, units, and navigation belong to
`common.*` or `nav.*`; entity chip labels belong to `status.*`; validation
messages belong to `validation.*`. Use i18next interpolation (`{{name}}`) and
keep interpolation variable names English and lower camel case. Keys listed as
references are defined once in the named shared table and are not additional
keys.

Resolved decisions applied here: Settings has no theme row; cooking requests
live inside My Orders and have no route or navigation label; mobile navigation
uses a dedicated Admin tab, not a More sheet.

## Login and inactive-profile onboarding

| key | uk | en | notes |
| --- | --- | --- | --- |
| `auth.login.wordmark` | Хатнє меню | Home Menu | Screen wordmark; differs from the existing app title. |
| `auth.login.tagline` | Що вдома їстівного — і що можна приготувати | What's edible at home — and what can be cooked |  |
| `auth.login.emailLabel` | Ел. пошта | Email |  |
| `auth.login.emailPlaceholder` | you@dim.ua | you@home.test | Synthetic placeholder. |
| `auth.login.passwordLabel` | Пароль | Password |  |
| `auth.login.showPassword` | Показати пароль | Show password | Accessible visibility-toggle label; implied by the visible control. |
| `auth.login.hidePassword` | Приховати пароль | Hide password | Accessible visibility-toggle label; implied by the visible control. |
| `auth.login.submit` | Увійти | Sign in |  |
| `auth.login.submitting` | Вхід… | Signing in… | Spinner button state. |
| `auth.login.noAccess` | Немає доступу? Зверніться до адміністратора | No access? Contact the administrator | Also reused as inactive-profile explanation. |
| `auth.login.invalidCredentials` | Невірна пошта або пароль | Wrong email or password | Server-error banner. |
| `auth.inactiveProfile.title` | Немає доступу | No access | PROPOSED headline required by the resolved StatePlaceholder decision. |
| `auth.inactiveProfile.description` | Немає доступу? Зверніться до адміністратора | No access? Contact the administrator | Reuses accepted resolved-decision copy. |
| `auth.signOut` | Вийти | Sign out | Existing key; inactive-profile affordance. |

References: `common.languageUk`, `common.languageEn`, `validation.required`,
and `validation.emailFormat`.

## Menu browse and reservation

| key | uk | en | notes |
| --- | --- | --- | --- |
| `menu.title` | Меню на сьогодні | Today's menu | Desktop page title. |
| `menu.loading` | Завантажуємо меню… | Loading menu… | CatArt `sleep` + skeletons. |
| `menu.empty.title` | На цей день нічого немає | Nothing for this day | CatArt `empty`. |
| `menu.empty.body` | Жодна страва не готова й не може бути приготована. Загляньте на інший день. | No dish is ready or can be cooked. Try another day. |  |
| `menu.empty.action` | Інший день | Another day |  |
| `menu.error.title` | Не вдалося завантажити | Couldn't load | CatArt `confused`. |
| `menu.error.body` | Перевірте з'єднання і спробуйте ще раз. | Check your connection and try again. |  |
| `menu.error.sharedBody` | Не вдалося завантажити меню. Перевірте з'єднання і спробуйте ще раз. | We couldn't load the menu. Check your connection and try again. | Full-page shared specimen. |
| `menu.card.readyCount` | {{count}} вільно | {{count}} ready | Ready-now counter. |
| `menu.card.zeroReady` | 0 готово | 0 ready | Cookable counter. |
| `menu.card.noCount` | — | — | Unavailable/not-configured counter. |
| `menu.card.ingredientsInStock` | Усі інгредієнти в наявності · ~{{minutes}} хв | All ingredients in stock · ~{{minutes}} min | Example description pattern. |
| `menu.card.missingIngredients` | Бракує: {{ingredients}}. | Missing {{ingredients}}. |  |
| `menu.card.recipeNotConfigured` | Рецепт ще не налаштовано. | Recipe not configured yet. |  |
| `menu.actions.reserve` | Зарезервувати | Reserve |  |
| `menu.actions.request` | Запит | Request |  |
| `menu.past.label` | Минув | Passed | Past-meal chip. |
| `menu.past.description` | Зараз {{now}} — резервування на цей прийом закрито. {{nextMeal}} о {{nextTime}} ще доступна. | It's {{now}} — reservations for this meal are closed. {{nextMeal}} at {{nextTime}} is still available. | Meal name is interpolated. |
| `menu.past.nextMealAction` | До {{meal}} → | To {{meal}} → |  |
| `menu.expiredBatch.chip` | ⚠ Прострочено | ⚠ Expired | Admin-only menu banner. |
| `menu.expiredBatch.body` | Партія від {{date}} прострочена — страва прихована з меню, порції чекають утилізації в «Партіях». | The batch from {{date}} has expired — the dish is hidden from the menu; portions await discarding in Batches. |  |
| `menu.expiredBatch.action` | До партій → | To batches → |  |
| `menu.reservation.title` | Зарезервувати порції | Reserve portions | Canonical title; supersedes short EN specimen “Reserve”. |
| `menu.reservation.subtitle` | {{dish}} · {{date}} · вільно {{count}} порцій | {{dish}} · {{date}} · {{count}} portions ready |  |
| `menu.reservation.portionsLabel` | Кількість порцій | Portions |  |
| `menu.reservation.remaining` | Залишиться {{remaining}} з {{available}} | {{remaining}} of {{available}} left | Ukrainian is PROPOSED; only EN semantics were sourced. |
| `menu.reservation.noteLabel` | Нотатка (необов'язково) | Note (optional) |  |
| `menu.reservation.notePlaceholder` | Менше солі, будь ласка | Less salt, please |  |
| `menu.reservation.confirm` | Зарезервувати | Confirm reservation | Dialog submit. |
| `menu.reservation.submitting` | Резервування… | Reserving… | PROPOSED submitting variant required by the global form rule. |
| `menu.reservation.taken.title` | Вільних порцій не залишилось | No free portions left | CatArt `empty` sheet state. |
| `menu.reservation.taken.body` | Щойно всі розібрали. Можна надіслати запит на готування. | They were just all taken. You can send a cooking request. |  |
| `menu.reservation.taken.action` | Запит на готування | Cooking request |  |
| `menu.reservation.error.title` | Не вдалося зарезервувати | Couldn't reserve | CatArt `confused`. |
| `menu.reservation.error.body` | Хтось випередив — залишилась {{available}} порція з {{requested}} потрібних. | Someone was faster — {{available}} portion left of the {{requested}} requested. | Implement plural handling separately if needed. |
| `menu.reservation.error.action` | Оновити наявність | Refresh availability |  |

References: `common.cancel`, `common.retry`, `common.meals.*`,
`status.dishAvailability.*`, `validation.reservationMax`, and navigation keys.

## My Orders

| key | uk | en | notes |
| --- | --- | --- | --- |
| `orders.title` | Мої замовлення | My Orders |  |
| `orders.tabs.active` | Активні | Active | Ukrainian inferred and confirmed by shared terminology. |
| `orders.tabs.history` | Історія | History |  |
| `orders.earlier` | Раніше | Earlier | Section overline. |
| `orders.loading` | Завантажуємо замовлення… | Loading orders… | CatArt `sleep`. |
| `orders.empty.title` | Ще немає замовлень | No orders yet | CatArt `empty`. |
| `orders.empty.body` | Миска Котика порожня. Загляньте в меню й зарезервуйте страву. | Kotyk's bowl is empty. Browse today's menu to reserve a dish. |  |
| `orders.empty.action` | До меню | Browse menu |  |
| `orders.error.title` | Щось пішло не так | Something went wrong | CatArt `confused`. |
| `orders.error.body` | Не вдалося отримати ваші замовлення. | Couldn't fetch your orders. |  |
| `orders.meta.request` | Запит · {{count}} порція · {{date}}, {{meal}} | Cooking request · {{count}} portion · {{date}}, {{meal}} | Count is an interpolation; plural variants may be added during implementation. |
| `orders.meta.reservation` | {{count}} порції · {{date}}, {{meal}} | Reserved · {{count}} portions · {{date}}, {{meal}} |  |
| `orders.meta.consumedAt` | спожито {{time}} | consumed {{time}} |  |
| `orders.meta.cancelledByUser` | Скасовано користувачем · {{date}} | Cancelled by user · {{date}} |  |
| `orders.reason` | Причина: {{reason}} | Reason: {{reason}} |  |
| `orders.actions.cancel` | Скасувати замовлення | Cancel order |  |
| `orders.actions.cancelUnavailable` | Скасувати — недоступно | Cancel — not available | Canonical disabled label. |
| `orders.actions.cancelUnavailableHelp` | Скасування вимкнено, щойно почалося готування. | Cancellation is disabled once cooking has started. |  |
| `orders.preparedHelp` | Без кнопок — порції резервуються автоматично з партії. | No buttons — portions are reserved automatically from the batch. |  |
| `orders.batchWarning` | Пов'язана партія прострочена або утилізована. Зверніться до адміністратора. | The linked batch has expired or was discarded. Contact an administrator. | PROPOSED warning required by a resolved decision; exact copy absent. |
| `orders.cancelDialog.title` | Скасувати замовлення? | Cancel this order? |  |
| `orders.cancelDialog.body` | {{count}} зарезервовані порції «{{dish}}» повернуться в спільну партію. | Your {{count}} reserved portions of {{dish}} will be released back to the household. |  |
| `orders.cancelDialog.keep` | Залишити | Keep |  |

References: `common.retry`, `common.meals.*`, and `status.order.*`.

## Cooking request (inside My Orders)

| key | uk | en | notes |
| --- | --- | --- | --- |
| `requests.loading` | Завантаження… | Loading… | Request subset state inside My Orders. |
| `requests.empty.title` | Немає активних запитів | No active requests | CatArt `empty`. |
| `requests.empty.body` | Захотілося чогось, чого немає в готовому? Попросіть приготувати. | Craving something that isn't ready-made? Ask for it to be cooked. |  |
| `requests.empty.action` | Створити запит | Create request | Navigates to Menu. |
| `requests.error.title` | Не вдалося завантажити | Couldn't load | CatArt `confused`. |
| `requests.error.body` | Спробуйте ще раз за мить. | Try again in a moment. |  |
| `requests.dialog.title` | Попросити приготувати | Ask to cook |  |
| `requests.dialog.subtitle` | {{dish}} · усі інгредієнти в наявності | {{dish}} · all ingredients in stock | Dish-bound dialog. |
| `requests.form.dateLabel` | Дата | Date |  |
| `requests.form.mealLabel` | Прийом їжі | Meal |  |
| `requests.form.portionsLabel` | Кількість порцій | Portions |  |
| `requests.form.submit` | Надіслати запит | Send request |  |
| `requests.form.submitting` | Надсилання… | Sending… | Global submitting state. |

References: `common.cancel`, `common.retry`, `common.meals.*`,
`validation.dateNotInPast`, and `validation.quantityAtLeastOne`.

## Admin dashboard

| key | uk | en | notes |
| --- | --- | --- | --- |
| `dashboard.adminOverline` | Адмін | Admin | Mobile header overline/desktop role. |
| `dashboard.title` | Панель | Dashboard |  |
| `dashboard.loading` | Рахуємо порції… | Counting portions… | CatArt `sleep`. |
| `dashboard.empty.title` | Усе спокійно | All calm | CatArt `idle`; no CTA. |
| `dashboard.empty.body` | Немає запитів, прострочених партій чи дефіциту. Котик задоволений. | No requests, expired batches, or shortages. Kotyk is content. |  |
| `dashboard.error.title` | Дані недоступні | Data unavailable | CatArt `confused`. |
| `dashboard.error.body` | Не вдалося отримати зведення. | Couldn't fetch the summary. |  |
| `dashboard.tiles.pendingRequests` | Запити | Pending requests |  |
| `dashboard.tiles.inProgress` | Готується | In progress |  |
| `dashboard.tiles.lowStock` | Дефіцит | Low-stock items |  |
| `dashboard.tiles.expiredBatch` | Прострочено | Expired batch |  |
| `dashboard.tiles.readyPortions` | Порцій вільно | Portions ready to reserve |  |
| `dashboard.quickActions.title` | Швидкі дії | Quick actions | PROPOSED UK; mockup source is English-only. |
| `dashboard.quickActions.reviewRequests` | Переглянути запити на готування | Review cooking requests | PROPOSED UK. |
| `dashboard.quickActions.restock` | Поповнити інгредієнти | Restock ingredients | PROPOSED UK. |
| `dashboard.pendingPanel.title` | Запити на готування, що очікують | Pending cooking requests | PROPOSED UK. |
| `dashboard.pendingPanel.viewAll` | Переглянути всі › | View all › | PROPOSED UK. |
| `dashboard.pendingPanel.approve` | Підтвердити | Approve |  |
| `dashboard.attention.title` | ⚠ Потребує уваги | ⚠ Needs attention | PROPOSED UK. |
| `dashboard.attention.expired` | Прострочено | Expired | PROPOSED UK pairing. |
| `dashboard.attention.lowAmount` | Залишилось {{amount}} {{unit}} | {{amount}} {{unit}} low | PROPOSED UK. |

Reference: `common.retry` and admin navigation keys.

## Admin orders

| key | uk | en | notes |
| --- | --- | --- | --- |
| `orders.admin.title` | Запити на готування | Cooking requests |  |
| `orders.admin.tabs.board` | Дошка | Board | PROPOSED label implied by Board/History split. |
| `orders.admin.tabs.history` | Історія | History | Resolved terminal-order tab. |
| `orders.admin.historyFilterLabel` | Фільтр за статусом | Filter by status | PROPOSED accessible label for required status-filterable list. |
| `orders.admin.loading` | Завантаження… | Loading… | CatArt `sleep` + column skeletons. |
| `orders.admin.empty.title` | Немає запитів | No requests |  |
| `orders.admin.empty.body` | Нових запитів на готування поки немає — дошка порожня. | No new cooking requests yet — the board is empty. |  |
| `orders.admin.error.title` | Дошка не завантажилась | The board didn't load |  |
| `orders.admin.error.body` | Спробуйте оновити. | Try refreshing. |  |
| `orders.admin.columnHeading` | {{status}} · {{count}} | {{status}} · {{count}} |  |
| `orders.admin.meta.requester` | {{requester}} · {{count}} порція · {{date}} | {{requester}} · {{count}} portion · {{date}} |  |
| `orders.admin.meta.batch` | {{requester}} · партія #{{batchNumber}} | {{requester}} · batch #{{batchNumber}} |  |
| `orders.admin.actions.approve` | Підтвердити | Approve |  |
| `orders.admin.actions.reject` | Відхилити | Reject |  |
| `orders.admin.actions.startCooking` | Почати готування | Start cooking |  |
| `orders.admin.actions.markPrepared` | Позначити приготованим | Mark as prepared |  |
| `orders.admin.actions.reserveForRequester` | Зарезервувати за замовником | Reserve for the requester |  |
| `orders.admin.actions.markConsumed` | Позначити спожитим | Mark as consumed |  |
| `orders.admin.rejection.title` | Відхилити запит? | Reject the request? |  |
| `orders.admin.rejection.context` | {{dish}} · {{requester}} · {{count}} порції · {{date}} | {{dish}} · {{requester}} · {{count}} portions · {{date}} |  |
| `orders.admin.rejection.reasonLabel` | Причина (необов'язково) | Reason (optional) |  |
| `orders.admin.rejection.helper` | Причину побачить автор запиту. | The requester will see the reason. |  |
| `orders.admin.batchWarning` | Пов'язана партія прострочена або утилізована. Скасуйте замовлення або перемістіть його до іншої партії. | The linked batch has expired or was discarded. Cancel the order or move it to another batch. | PROPOSED exact copy for resolved workflow. |
| `orders.admin.batchCorrection.cancelOrder` | Скасувати замовлення | Cancel order | PROPOSED correction option. |
| `orders.admin.batchCorrection.moveBatch` | Перемістити до іншої партії | Move to another batch | PROPOSED correction option. |

References: `common.back`, `common.cancel`, `common.retry`, `common.save`,
`common.saving`, `status.order.*`, and `validation.correctionReasonRequired`.

## Prepared batches

| key | uk | en | notes |
| --- | --- | --- | --- |
| `batches.title` | Партії | Prepared batches |  |
| `batches.loading` | Завантаження… | Loading… | CatArt `sleep`. |
| `batches.empty.title` | Немає готових партій | No prepared batches | CatArt `empty`. |
| `batches.empty.body` | Партія з'явиться, щойно ви позначите запит приготованим. | A batch will appear as soon as you mark a request as prepared. |  |
| `batches.error.title` | Не вдалося завантажити | Couldn't load | CatArt `confused`. |
| `batches.error.body` | Спробуйте ще раз. | Try again. |  |
| `batches.meta.cooked` | Приготовано {{date}} · {{time}} | Cooked {{date}} · {{time}} |  |
| `batches.meta.bestBefore` | {{date}} · {{time}} · придатна до {{bestBefore}} | {{date}} · {{time}} · best before {{bestBefore}} |  |
| `batches.meta.expired` | {{date}} · термін минув {{relativeDate}} | Cooked {{date}} · expired {{relativeDate}} |  |
| `batches.meta.discarded` | Утилізовано {{date}} · {{actor}} · {{count}} порції | Discarded {{date}} · {{actor}} · {{count}} portions |  |
| `batches.counters.available` | ВІЛЬНО | AVAIL | Compact card label. |
| `batches.counters.reserved` | РЕЗЕРВ | RESV |  |
| `batches.counters.consumed` | СПОЖИТО | USED |  |
| `batches.counters.discarded` | УТИЛІЗ. | DISC |  |
| `batches.actions.discard` | Утилізувати… | Discard… |  |
| `batches.actions.discardCount` | Утилізувати {{count}} порції | Discard {{count}} portions |  |
| `batches.actions.discardDisabled` | Утилізувати — усі порції зарезервовані | Discard — all portions are reserved | Disabled explanatory label. |
| `batches.expired.notice` | Резервування заблоковано. {{count}} порції очікують утилізації. | Reserving is blocked. {{count}} portions await disposal. |  |
| `batches.discarded.helper` | Без кнопок · залишається в журналі руху. | No buttons · stays in the movement log. |  |
| `batches.registration.title` | Партію приготовано | Batch prepared |  |
| `batches.registration.context` | {{dish}} · запит {{requester}} | {{dish}} · request by {{requester}} |  |
| `batches.registration.plannedLabel` | Планово, порцій | Planned, portions | Read-only. |
| `batches.registration.actualLabel` | Фактично * | Actual * |  |
| `batches.registration.bestBeforeLabel` | Придатна до * | Best before * |  |
| `batches.registration.actualBelowPlan` | Фактичний вихід менший за плановий — інвентар спишеться за фактом. | Actual yield is lower than planned — inventory is deducted by the actual amount. |  |
| `batches.registration.submit` | Зареєструвати партію | Register batch |  |
| `batches.discardDialog.title` | Утилізувати партію? | Discard the batch? |  |
| `batches.discardDialog.body` | {{dish}} · {{count}} вільні порції буде списано назавжди. Дію не можна скасувати. | {{dish}} · {{count}} available portions will be written off permanently. This cannot be undone. |  |
| `batches.discardDialog.confirm` | Утилізувати | Discard |  |

References: `common.cancel`, `common.keep`, `common.retry`, `common.saving`,
`status.batch.*`, `validation.required`, `validation.number`, and
`validation.expiryNotInPast`.

## Admin dishes

| key | uk | en | notes |
| --- | --- | --- | --- |
| `dishes.title` | Страви | Dishes |  |
| `dishes.tabs.active` | Активні | Active |  |
| `dishes.tabs.archived` | Архів | Archived |  |
| `dishes.loading` | Завантаження… | Loading… | CatArt `sleep`. |
| `dishes.empty.title` | Ще немає страв | No dishes yet | CatArt `empty`. |
| `dishes.empty.body` | Додайте першу страву з рецептом — і вона з'явиться в меню, щойно будуть інгредієнти. | Add the first dish with a recipe — it will appear in the menu as soon as the ingredients are there. | Full-screen canonical copy. |
| `dishes.empty.action` | + Додати страву | + Add dish |  |
| `dishes.error.title` | Не вдалося завантажити | Failed to load | CatArt `confused`. |
| `dishes.error.body` | Спробуйте ще раз. | Try again. |  |
| `dishes.card.portionIngredients` | Порція {{amount}} {{unit}} · {{count}} інгредієнти | Portion {{amount}} {{unit}} · {{count}} ingredients |  |
| `dishes.card.missing` | Бракує: {{ingredients}} | Missing: {{ingredients}} |  |
| `dishes.card.emptyRecipe` | Рецепт порожній — страва не з'являється в меню | Recipe is empty — the dish does not appear in the menu |  |
| `dishes.actions.edit` | Редагувати | Edit |  |
| `dishes.actions.archive` | В архів | Archive |  |
| `dishes.actions.configureRecipe` | Налаштувати рецепт | Configure the recipe |  |
| `dishes.form.createTitle` | Нова страва | New dish |  |
| `dishes.form.editTitle` | Редагувати страву | Edit dish | UK is PROPOSED; source is EN-only. |
| `dishes.form.close` | Закрити форму | Close form | PROPOSED accessible label for visible ✕. |
| `dishes.form.nameUkLabel` | Назва (укр) * | Name (UK) * |  |
| `dishes.form.nameEnLabel` | Назва (EN) | Name (EN) |  |
| `dishes.form.descriptionUkLabel` | Опис (укр) | Description (UK) |  |
| `dishes.form.descriptionEnLabel` | Опис (EN) | Description (EN) |  |
| `dishes.form.namePlaceholder` | Напр., «Грибне різото» | E.g., “Mushroom risotto” | Shared input specimen. |
| `dishes.form.portionSizeLabel` | Розмір порції | Portion size |  |
| `dishes.form.recipeTitle` | Рецепт | Recipe |  |
| `dishes.form.addIngredient` | + Додати інгредієнт | + Add ingredient |  |
| `dishes.form.ingredientPlaceholder` | Оберіть інгредієнт… | Choose an ingredient… |  |
| `dishes.form.removeIngredient` | Видалити інгредієнт | Remove ingredient | PROPOSED accessible label for visible ✕. |
| `dishes.form.unitsHelp` | Одиниці: г · кг · мл · л · шт · «наявність» | Units: g · kg · ml · l · pcs · “presence” |  |
| `dishes.form.mealTypesLabel` | Прийоми їжі | Meal types |  |
| `dishes.form.save` | Зберегти страву | Save dish |  |
| `dishes.archiveDialog.title` | Архівувати страву? | Archive the dish? |  |
| `dishes.archiveDialog.body` | «{{dish}}» зникне з меню. Історія замовлень збережеться, страву можна відновити з архіву. | “{{dish}}” will disappear from the menu. Order history is kept; the dish can be restored from the archive. | Full list variant. |
| `dishes.archiveDialog.keep` | Залишити | Keep |  |
| `dishes.archiveDialog.confirm` | В архів | To archive |  |

References: `common.cancel`, `common.retry`, `common.saving`, `common.meals.*`,
`common.units.*`, `status.dishAvailability.*`, `validation.required`,
`validation.portionRange`, `validation.incompleteRecipeRow`,
`validation.quantityGreaterThanZero`, and `validation.mealTypeRequired`.

## Admin inventory and movement log

| key | uk | en | notes |
| --- | --- | --- | --- |
| `inventory.title` | Інвентар | Inventory | Catalog target follows transcription; existing implementation uses “Запаси”. |
| `inventory.historyLink` | Журнал руху › | History › |  |
| `inventory.loading` | Перелічуємо запаси… | Counting the supplies… | CatArt `sleep`. |
| `inventory.empty.title` | Інвентар порожній | Inventory is empty | CatArt `empty`. |
| `inventory.empty.body` | Додайте перший інгредієнт, щоб рецепти могли рахувати доступність. | Add the first ingredient so recipes can compute availability. |  |
| `inventory.empty.action` | + Додати інгредієнт | + Add ingredient |  |
| `inventory.error.title` | Не вдалося завантажити | Failed to load | CatArt `confused`. |
| `inventory.error.body` | Перевірте з'єднання. | Check the connection. |  |
| `inventory.card.amountLeft` | Залишилось {{amount}} {{unit}} | {{amount}} {{unit}} left |  |
| `inventory.card.trackedByPresence` | Облік за наявністю | Tracked by presence | UK PROPOSED; EN-only mockup. |
| `inventory.card.zeroAmount` | 0 {{unit}} — закінчилися | 0 {{unit}} — ran out |  |
| `inventory.stock.low` | Мало | Low stock |  |
| `inventory.stock.inStock` | Є | In stock |  |
| `inventory.stock.out` | Немає | Out |  |
| `inventory.actions.restock` | Поповнити | Restock |  |
| `inventory.actions.correct` | Коригувати | Correct | UK PROPOSED; EN-only mockup. |
| `inventory.history.title` | Журнал руху | Movement log |  |
| `inventory.history.back` | До інвентарю | Back to inventory | Visible back affordance label. |
| `inventory.history.filters.all` | Усі | All | UK PROPOSED. |
| `inventory.history.filters.restock` | Поповнення | Restock | UK PROPOSED. |
| `inventory.history.filters.correction` | Коригування | Correction | UK PROPOSED. |
| `inventory.history.filters.consumed` | Спожито | Consumed | UK PROPOSED. |
| `inventory.history.today` | Сьогодні | Today |  |
| `inventory.history.yesterday` | Вчора | Yesterday |  |
| `inventory.history.entryMeta` | {{type}} · {{actor}} · {{time}} | {{type}} · {{actor}} · {{time}} |  |
| `inventory.history.presenceOut` | Наявність → Немає | Presence → Out |  |
| `inventory.history.setOut` | позначено відсутнім | set out | PROPOSED UK. |
| `inventory.correction.title` | Коригування залишку | Stock correction |  |
| `inventory.correction.context` | {{ingredient}} · зараз {{amount}} {{unit}} | {{ingredient}} · current {{amount}} {{unit}} |  |
| `inventory.correction.amountLabel` | Нова кількість | New quantity |  |
| `inventory.correction.reasonLabel` | Причина * | Reason * required |  |
| `inventory.correction.reasonPlaceholder` | Опишіть, чому змінюється залишок… | Describe why the stock changes… |  |
| `inventory.correction.helper` | Запис додається до незмінного журналу руху. | Logged to the append-only movement history. |  |

References: `common.cancel`, `common.retry`, `common.save`, `common.saving`,
`common.units.*`, and `validation.correctionReasonRequired`.

The already-implemented add/edit, restock, and existing inventory-history copy
remains canonical where the transcription explicitly says those dialogs stand;
this table catalogs the visible transcription deltas only.

## Settings

| key | uk | en | notes |
| --- | --- | --- | --- |
| `settings.title` | Налаштування | Settings |  |
| `settings.mealTimes.title` | Типовий час прийомів їжі | Default meal times | UK PROPOSED; EN-only header. |
| `settings.mealTimes.defaultBanner` | Використовуються типові значення — збережіть, щоб зафіксувати свої. | Default values are in use — save to lock in your own. | Never-saved state. |
| `settings.mealTimes.defaultsHelp` | Типові: 08:00 · 13:00 · 19:00 · застосовуються до нових запитів, наявні не змінюються. | Defaults: 08:00 · 13:00 · 19:00 · they apply to new requests; existing ones are unchanged. |  |
| `settings.mealTimes.reset` | Скинути до типових | Reset to defaults |  |
| `settings.language.title` | Мова | Language | UK implied. |
| `settings.language.appLanguage` | Мова застосунку | App language | UK PROPOSED; EN-only label. |
| `settings.save` | Зберегти | Save changes | Canonical single action despite source label mismatch. |
| `settings.saving` | Збереження… | Saving… |  |
| `settings.loading` | Завантаження… | Loading… | Skeleton state. |
| `settings.error.title` | Не збереглося | Didn't save | Save error. |
| `settings.error.body` | Зміни не застосовано — спробуйте ще раз. | The changes were not applied — try again. |  |
| `settings.saveDisabledHelp` | Кнопка вимкнена, поки форма невалідна. | Button is disabled while validation errors exist. | Global form annotation. |

References: `common.retry`, `common.languageUk`, `common.languageEn`, and
`common.meals.*`. There is intentionally no `settings.theme` key.

## Shared patterns

| key | uk | en | notes |
| --- | --- | --- | --- |
| `common.loading` | Завантаження… | Loading… | Unicode ellipsis matches transcriptions. |
| `common.error` | Щось пішло не так | Something went wrong | Generic error title. |
| `common.retry` | Повторити | Retry |  |
| `common.cancel` | Скасувати | Cancel |  |
| `common.keep` | Залишити | Keep |  |
| `common.back` | Назад | Back |  |
| `common.save` | Зберегти | Save |  |
| `common.saving` | Збереження… | Saving… | Spinner state. |
| `common.submitDisabledHelp` | Кнопка вимкнена, поки є помилки валідації. | Button is disabled while validation errors exist. |  |
| `common.languageUk` | UA | UA | Display label only; locale code remains `uk`. |
| `common.languageEn` | EN | EN |  |
| `common.moreCount` | …ще {{count}} | …{{count}} more | Long-list fade. |
| `common.meals.breakfast` | Сніданок | Breakfast |  |
| `common.meals.lunch` | Обід | Lunch |  |
| `common.meals.dinner` | Вечеря | Dinner |  |
| `common.categories.soup` | Суп | Soup |  |
| `common.categories.dessert` | Десерт | Dessert |  |
| `common.units.gram` | г | g |  |
| `common.units.kilogram` | кг | kg |  |
| `common.units.milliliter` | мл | ml |  |
| `common.units.liter` | л | l |  |
| `common.units.piece` | шт | pcs |  |
| `common.units.presence` | наявність | presence | Recipe helper. |
| `nav.menu` | Меню | Menu | Mobile and drawer. |
| `nav.myOrders` | Замовлення | Orders | Mobile label; screen title remains “My Orders”. |
| `nav.admin` | Адмін | Admin | Canonical third mobile tab. |
| `nav.dashboard` | Панель | Dashboard | Admin drawer. |
| `nav.cookingRequests` | Запити на готування | Cooking requests | Admin drawer only. |
| `nav.dishes` | Страви | Dishes |  |
| `nav.inventory` | Інвентар | Inventory |  |
| `nav.batches` | Партії | Batches |  |
| `nav.settings` | Налаштування | Settings |  |
| `nav.landmark` | Основна навігація | Primary navigation | Existing accessible label. |

No `nav.requests` or `nav.more` key is part of the target design.

## Status namespace

| key | uk | en | notes |
| --- | --- | --- | --- |
| `status.order.pending` | Очікує | Pending |  |
| `status.order.approved` | Підтверджено | Approved |  |
| `status.order.cooking` | Готується | Cooking |  |
| `status.order.prepared` | Приготовано | Prepared |  |
| `status.order.reserved` | Зарезервовано | Reserved |  |
| `status.order.consumed` | Спожито | Consumed |  |
| `status.order.rejected` | Відхилено | Rejected |  |
| `status.order.cancelled` | Скасовано | Cancelled |  |
| `status.dishAvailability.readyNow` | Готово зараз | Ready now | Canonical full label. |
| `status.dishAvailability.canBeCooked` | Можна приготувати | Can be cooked |  |
| `status.dishAvailability.unavailable` | Недоступно | Unavailable |  |
| `status.dishAvailability.notConfigured` | Не налаштовано | Not configured |  |
| `status.batch.fresh` | Свіжа | Fresh |  |
| `status.batch.expiring` | ⏳ Зіпсується за {{hours}} год | ⏳ Expires in {{hours}}h | Parameterized time. |
| `status.batch.expired` | ⚠ Прострочена | ⚠ Expired |  |
| `status.batch.fullyReserved` | Повністю зарезервована | Fully reserved |  |
| `status.batch.discarded` | Утилізована | Discarded |  |

Draft chip labels “Ready”, “Completed”, “Can cook”, and “Not set” are omitted;
the resolved full status matrices are authoritative.

## Validation namespace

| key | uk | en | notes |
| --- | --- | --- | --- |
| `validation.required` | Обов'язкове поле | Required field | Generic required rule. |
| `validation.emailFormat` | Невірний формат пошти | Invalid email format |  |
| `validation.portionRange` | Мінімум {{min}} г, максимум {{max}} г | Minimum {{min}} g, maximum {{max}} g | Dish portion size. |
| `validation.minQuantity` | Мінімум {{min}} | Minimum {{min}} | Generic minimum. |
| `validation.maxQuantity` | Максимум {{max}} | Maximum {{max}} | Generic maximum. |
| `validation.quantityGreaterThanZero` | Кількість має бути більшою за 0 | Quantity must be greater than 0 | Required for every added recipe row. PROPOSED explicit message; rule was sourced without separate copy. |
| `validation.quantityAtLeastOne` | Кількість має бути не менше 1 | Quantity must be at least 1 | Request/reservation stepper rule. PROPOSED explicit message; normally enforced by control. |
| `validation.integerQuantity` | Кількість має бути цілим числом | Quantity must be a whole number | Request portions. PROPOSED explicit message; rule was sourced without copy. |
| `validation.number` | Введіть число | Enter a number | Actual batch yield. PROPOSED explicit message; numeric rule was sourced without copy. |
| `validation.dateNotInPast` | Дата не може бути в минулому | Date cannot be in the past |  |
| `validation.expiryNotInPast` | Термін придатності не може бути в минулому | The expiration date cannot be in the past |  |
| `validation.incompleteRecipeRow` | Заповніть рядок або видаліть його | Complete the row or remove it |  |
| `validation.mealTypeRequired` | Оберіть хоча б один прийом їжі | Select at least one meal type |  |
| `validation.correctionReasonRequired` | Вкажіть причину — поле обов'язкове | Provide a reason — the field is required |  |
| `validation.reservationMax` | Максимум {{max}} — стільки вільних порцій у партії | Maximum {{max}} — that's how many free portions the batch has |  |

## Gaps

`PROPOSED` values above identify every visible or resolved-decision string for
which one locale was absent, or for which a visible icon/control required an
accessible label not transcribed:

- The standalone `onboarding.md` named in the task does not exist. The only
  onboarding source is the resolved inactive-profile decision in `login.md`;
  `auth.inactiveProfile.title` is therefore proposed and no onboarding screen
  beyond that pattern is invented.
- Ukrainian missing from English-only mockups: dashboard quick actions,
  pending/attention panels, inventory filter/action/presence copy, settings
  section labels, and the dish edit title. Proposed values are marked inline.
- English or Ukrainian source missing for inferred workflow/accessibility copy:
  reservation remaining/submitting text, order batch warnings and correction
  options, Admin Board/filter labels, close/remove icon labels, inactive-profile
  headline, and explicit messages for rules otherwise enforced by controls.
- English dashboard data-state equivalents were described as proposed by the
  transcription itself; the table preserves those supplied equivalents but
  does not relabel them as new catalog proposals.

Sample personal names and household data shown in mockups are not translation
values. All corresponding strings use interpolation placeholders such as
`{{requester}}`, `{{dish}}`, and `{{ingredient}}`.
