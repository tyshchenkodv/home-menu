import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { afterAll, afterEach, beforeAll, describe, it } from 'vitest';

/**
 * Firestore Security Rules matrix for the admin inventory foundation slice.
 * Runs against the Firestore emulator started by
 * `firebase emulators:exec --only firestore` (see `firebase.json` and the
 * `test:rules` npm script). This suite requires Java 21+ locally; it is not
 * part of `npm test` (see `vitest.rules.config.ts`).
 *
 * Synthetic-only identities: `test-admin-uid`, `test-user-uid`,
 * `test-inactive-uid`, `test-unprovisioned-uid`. Authorization is entirely
 * driven by Firebase Auth custom claims (`role`, `isActive`) injected via
 * `testEnv.authenticatedContext(uid, claims)` — there are no real UIDs,
 * emails, or project IDs here (see docs/06-auth-and-security.md, "Initial
 * provisioning").
 */

const PROJECT_ID = 'home-menu-rules-test';

const REPO_ROOT = resolve(__dirname, '../..');
const rulesSource = readFileSync(resolve(REPO_ROOT, 'firestore.rules'), 'utf8');
const firebaseConfig = JSON.parse(readFileSync(resolve(REPO_ROOT, 'firebase.json'), 'utf8')) as {
  emulators: { firestore: { port: number } };
};

const EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST?.split(':')[0] ?? '127.0.0.1';
const EMULATOR_PORT = process.env.FIRESTORE_EMULATOR_HOST
  ? Number(process.env.FIRESTORE_EMULATOR_HOST.split(':')[1])
  : firebaseConfig.emulators.firestore.port;

// Identities are provisioned purely via Firebase Auth custom claims
// (`role`, `isActive`) passed as the second argument to
// `testEnv.authenticatedContext(uid, claims)`; there are no per-identity
// email constants because email is not part of the authorization signal.
const ADMIN_UID = 'test-admin-uid';
const USER_UID = 'test-user-uid';
const INACTIVE_UID = 'test-inactive-uid';
// No claims at all: the direct rules-level analog of an un-provisioned,
// never-added-by-the-owner Google account (docs/06 "no self-signup").
const UNPROVISIONED_UID = 'test-unprovisioned-uid';

const ACTIVE_INGREDIENT_ID = 'ingredient-flour';
const ACTIVE_DISH_ID = 'dish-pancakes';
const AVAILABLE_BATCH_ID = 'batch-risotto-1';
const OTHER_USER_ORDER_ID = 'order-other-user';

const now = serverTimestamp();

const quantityIngredient = {
  name: 'Flour',
  trackingMode: 'quantity' as const,
  baseUnit: 'gram' as const,
  quantity: 1000,
  isPresent: null,
  lowStockThreshold: 200,
  archivedAt: null,
  createdAt: now,
  createdBy: ADMIN_UID,
  updatedAt: now,
  updatedBy: ADMIN_UID,
};

const pancakesDish = {
  name: 'Pancakes',
  description: '',
  mealTypes: ['breakfast'] as const,
  recipeItems: [
    {
      ingredientId: ACTIVE_INGREDIENT_ID,
      ingredientName: 'Flour',
      requiredQuantity: 300,
      requiresPresence: null,
    },
  ],
  archivedAt: null,
  createdAt: now,
  createdBy: ADMIN_UID,
  updatedAt: now,
  updatedBy: ADMIN_UID,
};

const availableBatch = {
  dishId: ACTIVE_DISH_ID,
  dishName: 'Pancakes',
  batchNumber: 1,
  producedQuantity: 4,
  availableQuantity: 4,
  reservedQuantity: 0,
  consumedQuantity: 0,
  discardedQuantity: 0,
  preparedAt: now,
  expiresAt: null,
  status: 'available' as const,
  sourceCookingRequestId: null,
  createdAt: now,
  createdBy: ADMIN_UID,
  updatedAt: now,
  updatedBy: ADMIN_UID,
};

const generalSettings = {
  timezone: 'Europe/Kyiv' as const,
  defaultMealTimes: { breakfast: '08:00', lunch: '13:00', dinner: '19:00' },
  updatedAt: now,
  updatedBy: ADMIN_UID,
};

function buildReadyOrder(overrides: Record<string, unknown> = {}) {
  return {
    userId: USER_UID,
    userDisplayName: 'Test User',
    dishId: ACTIVE_DISH_ID,
    dishName: 'Pancakes',
    kind: 'ready' as const,
    status: 'reserved' as const,
    quantity: 2,
    mealType: 'breakfast' as const,
    scheduledFor: now,
    allocations: [{ batchId: AVAILABLE_BATCH_ID, quantity: 2 }],
    rejectionReason: null,
    preparedBatchId: null,
    preparedBatchNumber: null,
    createdAt: now,
    createdBy: USER_UID,
    updatedAt: now,
    updatedBy: USER_UID,
    ...overrides,
  };
}

function buildCookOrder(overrides: Record<string, unknown> = {}) {
  return {
    userId: USER_UID,
    userDisplayName: 'Test User',
    dishId: ACTIVE_DISH_ID,
    dishName: 'Pancakes',
    kind: 'cook' as const,
    status: 'pending' as const,
    quantity: 1,
    mealType: 'lunch' as const,
    scheduledFor: now,
    allocations: [] as unknown[],
    rejectionReason: null,
    preparedBatchId: null,
    preparedBatchNumber: null,
    createdAt: now,
    createdBy: USER_UID,
    updatedAt: now,
    updatedBy: USER_UID,
    ...overrides,
  };
}

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: rulesSource,
      host: EMULATOR_HOST,
      port: EMULATOR_PORT,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

// Seeds only non-auth fixture data. Authorization now comes exclusively
// from the claims passed to `authenticatedContext`, so there is no
// `users/{uid}` profile-doc seeding here: a "user" in these tests is
// entirely defined by its claims, not by a Firestore document.
async function seedFixtures(): Promise<void> {
  await testEnv.withSecurityRulesDisabled(async context => {
    const db = context.firestore();

    await setDoc(doc(db, 'ingredients', ACTIVE_INGREDIENT_ID), quantityIngredient);
    await setDoc(doc(db, 'dishes', ACTIVE_DISH_ID), pancakesDish);
    await setDoc(doc(db, 'preparedBatches', AVAILABLE_BATCH_ID), availableBatch);
  });
}

describe('firestore.rules', () => {
  describe('unauthenticated access', () => {
    it('denies reading users, ingredients, and movements', async () => {
      await seedFixtures();
      const context = testEnv.unauthenticatedContext();
      const db = context.firestore();

      await assertFails(getDoc(doc(db, 'users', ADMIN_UID)));
      await assertFails(getDoc(doc(db, 'ingredients', ACTIVE_INGREDIENT_ID)));
      await assertFails(getDoc(doc(db, 'inventoryMovements', 'movement-1')));
    });

    it('denies writing ingredients and movements', async () => {
      await seedFixtures();
      const context = testEnv.unauthenticatedContext();
      const db = context.firestore();

      await assertFails(setDoc(doc(db, 'ingredients', 'new-ingredient'), quantityIngredient));
      await assertFails(
        addDoc(collection(db, 'inventoryMovements'), {
          ingredientId: ACTIVE_INGREDIENT_ID,
          ingredientName: 'Flour',
          type: 'restock',
          deltaQuantity: 100,
          presenceBefore: null,
          presenceAfter: null,
          balanceAfter: 1100,
          cookingRequestId: null,
          preparedBatchId: null,
          note: null,
          createdAt: now,
          createdBy: 'nobody',
        }),
      );
    });
  });

  describe('unprovisioned account', () => {
    // A signed-in token with no `role` claim at all — the direct rules-level
    // analog of a Google account the owner never provisioned (docs/06
    // "no self-signup"). It must be denied on every collection it touches,
    // exactly like an unauthenticated request, even though `request.auth`
    // is non-null.

    it('denies reading and writing ingredients and movements', async () => {
      await seedFixtures();
      const context = testEnv.authenticatedContext(UNPROVISIONED_UID, {});
      const db = context.firestore();

      await assertFails(getDoc(doc(db, 'ingredients', ACTIVE_INGREDIENT_ID)));
      await assertFails(getDoc(doc(db, 'inventoryMovements', 'movement-1')));
      await assertFails(updateDoc(doc(db, 'ingredients', ACTIVE_INGREDIENT_ID), { name: 'Hacked' }));
      await assertFails(setDoc(doc(db, 'ingredients', 'new-ingredient'), quantityIngredient));
    });

    it('denies reading and writing dishes', async () => {
      await seedFixtures();
      const context = testEnv.authenticatedContext(UNPROVISIONED_UID, {});
      const db = context.firestore();

      await assertFails(getDoc(doc(db, 'dishes', ACTIVE_DISH_ID)));
      await assertFails(setDoc(doc(db, 'dishes', 'new-dish'), pancakesDish));
    });

    it('denies reading and writing prepared batches', async () => {
      await seedFixtures();
      const context = testEnv.authenticatedContext(UNPROVISIONED_UID, {});
      const db = context.firestore();

      await assertFails(getDoc(doc(db, 'preparedBatches', AVAILABLE_BATCH_ID)));
      await assertFails(setDoc(doc(db, 'preparedBatches', 'new-batch'), availableBatch));
      await assertFails(
        updateDoc(doc(db, 'preparedBatches', AVAILABLE_BATCH_ID), {
          availableQuantity: 2,
          reservedQuantity: 2,
          updatedAt: serverTimestamp(),
          updatedBy: UNPROVISIONED_UID,
        }),
      );
    });

    it('denies reading and creating orders, even its own', async () => {
      await seedFixtures();
      const context = testEnv.authenticatedContext(UNPROVISIONED_UID, {});
      const db = context.firestore();

      await assertFails(getDoc(doc(db, 'orders', 'order-1')));
      await assertFails(
        setDoc(doc(db, 'orders', 'order-unprovisioned'), buildReadyOrder({ userId: UNPROVISIONED_UID })),
      );
    });

    it('denies reading and writing settings', async () => {
      await seedFixtures();
      await testEnv.withSecurityRulesDisabled(async context => {
        await setDoc(doc(context.firestore(), 'settings', 'general'), generalSettings);
      });
      const context = testEnv.authenticatedContext(UNPROVISIONED_UID, {});
      const db = context.firestore();

      await assertFails(getDoc(doc(db, 'settings', 'general')));
      await assertFails(
        updateDoc(doc(db, 'settings', 'general'), {
          updatedAt: serverTimestamp(),
          updatedBy: UNPROVISIONED_UID,
        }),
      );
    });

    it('may read only its own (nonexistent) user document, not others', async () => {
      await seedFixtures();
      const context = testEnv.authenticatedContext(UNPROVISIONED_UID, {});
      const db = context.firestore();

      await assertFails(getDoc(doc(db, 'users', ADMIN_UID)));
      await assertSucceeds(getDoc(doc(db, 'users', UNPROVISIONED_UID)));
    });
  });

  describe('inactive account', () => {
    it('denies reading and writing ingredients and movements', async () => {
      await seedFixtures();
      const context = testEnv.authenticatedContext(INACTIVE_UID, { role: 'user', isActive: false });
      const db = context.firestore();

      await assertFails(getDoc(doc(db, 'ingredients', ACTIVE_INGREDIENT_ID)));
      await assertFails(getDoc(doc(db, 'inventoryMovements', 'movement-1')));
      await assertFails(updateDoc(doc(db, 'ingredients', ACTIVE_INGREDIENT_ID), { name: 'Hacked' }));
    });

    it('may still read its own user document', async () => {
      await seedFixtures();
      const context = testEnv.authenticatedContext(INACTIVE_UID, { role: 'user', isActive: false });
      const db = context.firestore();

      await assertSucceeds(getDoc(doc(db, 'users', INACTIVE_UID)));
    });
  });

  describe('role "user" (active, non-admin)', () => {
    it('may read ingredients but not inventory movements', async () => {
      await seedFixtures();
      const context = testEnv.authenticatedContext(USER_UID, { role: 'user', isActive: true });
      const db = context.firestore();

      await assertSucceeds(getDoc(doc(db, 'ingredients', ACTIVE_INGREDIENT_ID)));
      await assertFails(getDoc(doc(db, 'inventoryMovements', 'movement-1')));
    });

    it('is denied ingredient writes', async () => {
      await seedFixtures();
      const context = testEnv.authenticatedContext(USER_UID, { role: 'user', isActive: true });
      const db = context.firestore();

      await assertFails(setDoc(doc(db, 'ingredients', 'new-ingredient'), quantityIngredient));
      await assertFails(updateDoc(doc(db, 'ingredients', ACTIVE_INGREDIENT_ID), { name: 'Hacked' }));
    });

    it('is denied inventory movement creation', async () => {
      await seedFixtures();
      const context = testEnv.authenticatedContext(USER_UID, { role: 'user', isActive: true });
      const db = context.firestore();

      await assertFails(
        addDoc(collection(db, 'inventoryMovements'), {
          ingredientId: ACTIVE_INGREDIENT_ID,
          ingredientName: 'Flour',
          type: 'restock',
          deltaQuantity: 100,
          presenceBefore: null,
          presenceAfter: null,
          balanceAfter: 1100,
          cookingRequestId: null,
          preparedBatchId: null,
          note: null,
          createdAt: now,
          createdBy: USER_UID,
        }),
      );
    });

    it('cannot create its own users/{uid} document or escalate role', async () => {
      await seedFixtures();
      const context = testEnv.authenticatedContext(USER_UID, { role: 'user', isActive: true });
      const db = context.firestore();

      await assertFails(
        setDoc(doc(db, 'users', 'test-new-uid'), {
          displayName: 'New',
          email: 'new@example.test',
          role: 'user',
          active: true,
          createdAt: now,
          updatedAt: now,
        }),
      );
      await assertFails(updateDoc(doc(db, 'users', USER_UID), { role: 'admin' }));
    });
  });

  describe('active admin', () => {
    it('can create, update, archive, and restore ingredients', async () => {
      await seedFixtures();
      const context = testEnv.authenticatedContext(ADMIN_UID, { role: 'admin', isActive: true });
      const db = context.firestore();

      await assertSucceeds(
        setDoc(doc(db, 'ingredients', 'ingredient-sugar'), {
          ...quantityIngredient,
          name: 'Sugar',
        }),
      );

      await assertSucceeds(
        updateDoc(doc(db, 'ingredients', ACTIVE_INGREDIENT_ID), {
          name: 'Flour (updated)',
          updatedAt: serverTimestamp(),
          updatedBy: ADMIN_UID,
        }),
      );

      await assertSucceeds(
        updateDoc(doc(db, 'ingredients', ACTIVE_INGREDIENT_ID), {
          archivedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          updatedBy: ADMIN_UID,
        }),
      );

      await assertSucceeds(
        updateDoc(doc(db, 'ingredients', ACTIVE_INGREDIENT_ID), {
          archivedAt: null,
          updatedAt: serverTimestamp(),
          updatedBy: ADMIN_UID,
        }),
      );
    });

    it('denies a create with a forged (non-server) createdAt/updatedAt, but allows a serverTimestamp()-anchored one (T6.1)', async () => {
      await seedFixtures();
      const context = testEnv.authenticatedContext(ADMIN_UID, { role: 'admin', isActive: true });
      const db = context.firestore();

      // A client-supplied wall-clock value is never equal to `request.time`.
      await assertFails(
        setDoc(doc(db, 'ingredients', 'ingredient-forged'), {
          ...quantityIngredient,
          name: 'Forged',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        }),
      );

      // The real client write path (`ingredientService.createIngredient`)
      // anchors both fields with `serverTimestamp()`, which resolves to
      // exactly `request.time` on commit.
      await assertSucceeds(
        setDoc(doc(db, 'ingredients', 'ingredient-anchored'), {
          ...quantityIngredient,
          name: 'Anchored',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
      );
    });

    it('can create inventory movements', async () => {
      await seedFixtures();
      const context = testEnv.authenticatedContext(ADMIN_UID, { role: 'admin', isActive: true });
      const db = context.firestore();

      await assertSucceeds(
        addDoc(collection(db, 'inventoryMovements'), {
          ingredientId: ACTIVE_INGREDIENT_ID,
          ingredientName: 'Flour',
          type: 'restock',
          deltaQuantity: 100,
          presenceBefore: null,
          presenceAfter: null,
          balanceAfter: 1100,
          cookingRequestId: null,
          preparedBatchId: null,
          note: null,
          createdAt: now,
          createdBy: ADMIN_UID,
        }),
      );
    });

    it('cannot update or delete an inventory movement', async () => {
      await seedFixtures();
      await testEnv.withSecurityRulesDisabled(async context => {
        await setDoc(doc(context.firestore(), 'inventoryMovements', 'movement-1'), {
          ingredientId: ACTIVE_INGREDIENT_ID,
          ingredientName: 'Flour',
          type: 'restock',
          deltaQuantity: 100,
          presenceBefore: null,
          presenceAfter: null,
          balanceAfter: 1100,
          cookingRequestId: null,
          preparedBatchId: null,
          note: null,
          createdAt: now,
          createdBy: ADMIN_UID,
        });
      });

      const context = testEnv.authenticatedContext(ADMIN_UID, { role: 'admin', isActive: true });
      const db = context.firestore();

      await assertFails(updateDoc(doc(db, 'inventoryMovements', 'movement-1'), { note: 'edited' }));
      await assertFails(deleteDoc(doc(db, 'inventoryMovements', 'movement-1')));
    });

    it('cannot delete an ingredient', async () => {
      await seedFixtures();
      const context = testEnv.authenticatedContext(ADMIN_UID, { role: 'admin', isActive: true });
      const db = context.firestore();

      await assertFails(deleteDoc(doc(db, 'ingredients', ACTIVE_INGREDIENT_ID)));
    });

    it('cannot create a users/{uid} document or change a role', async () => {
      await seedFixtures();
      const context = testEnv.authenticatedContext(ADMIN_UID, { role: 'admin', isActive: true });
      const db = context.firestore();

      await assertFails(
        setDoc(doc(db, 'users', 'test-new-uid'), {
          displayName: 'New',
          email: 'new@example.test',
          role: 'user',
          active: true,
          createdAt: now,
          updatedAt: now,
        }),
      );
      await assertFails(updateDoc(doc(db, 'users', USER_UID), { role: 'admin' }));
    });

    it('rejects an ingredient write that violates the field allowlist or enum values', async () => {
      await seedFixtures();
      const context = testEnv.authenticatedContext(ADMIN_UID, { role: 'admin', isActive: true });
      const db = context.firestore();

      await assertFails(
        setDoc(doc(db, 'ingredients', 'ingredient-invalid'), {
          ...quantityIngredient,
          trackingMode: 'not-a-mode',
        }),
      );
      await assertFails(
        setDoc(doc(db, 'ingredients', 'ingredient-invalid-2'), {
          ...quantityIngredient,
          extraField: 'not allowed',
        }),
      );
    });

    it('rejects a movement create with an out-of-scope type', async () => {
      await seedFixtures();
      const context = testEnv.authenticatedContext(ADMIN_UID, { role: 'admin', isActive: true });
      const db = context.firestore();

      await assertFails(
        addDoc(collection(db, 'inventoryMovements'), {
          ingredientId: ACTIVE_INGREDIENT_ID,
          ingredientName: 'Flour',
          type: 'archive_adjustment',
          deltaQuantity: -100,
          presenceBefore: null,
          presenceAfter: null,
          balanceAfter: 900,
          cookingRequestId: null,
          preparedBatchId: null,
          note: null,
          createdAt: now,
          createdBy: ADMIN_UID,
        }),
      );
    });

    it('allows a cooking movement linked to a prepared batch (with or without a source cooking request), but rejects one missing the batch link', async () => {
      await seedFixtures();
      const context = testEnv.authenticatedContext(ADMIN_UID, { role: 'admin', isActive: true });
      const db = context.firestore();

      // Request-driven `completeCooking`: both linkage fields set.
      await assertSucceeds(
        addDoc(collection(db, 'inventoryMovements'), {
          ingredientId: ACTIVE_INGREDIENT_ID,
          ingredientName: 'Flour',
          type: 'cooking',
          deltaQuantity: -300,
          presenceBefore: null,
          presenceAfter: null,
          balanceAfter: 700,
          cookingRequestId: 'order-cook-request',
          preparedBatchId: AVAILABLE_BATCH_ID,
          note: null,
          createdAt: now,
          createdBy: ADMIN_UID,
        }),
      );

      // Ad-hoc admin cooking (Task 7): no source request, batch still set.
      await assertSucceeds(
        addDoc(collection(db, 'inventoryMovements'), {
          ingredientId: ACTIVE_INGREDIENT_ID,
          ingredientName: 'Flour',
          type: 'cooking',
          deltaQuantity: -300,
          presenceBefore: null,
          presenceAfter: null,
          balanceAfter: 400,
          cookingRequestId: null,
          preparedBatchId: AVAILABLE_BATCH_ID,
          note: null,
          createdAt: now,
          createdBy: ADMIN_UID,
        }),
      );

      // A `cooking` movement without a batch link could not have come from
      // either real flow.
      await assertFails(
        addDoc(collection(db, 'inventoryMovements'), {
          ingredientId: ACTIVE_INGREDIENT_ID,
          ingredientName: 'Flour',
          type: 'cooking',
          deltaQuantity: -300,
          presenceBefore: null,
          presenceAfter: null,
          balanceAfter: 100,
          cookingRequestId: null,
          preparedBatchId: null,
          note: null,
          createdAt: now,
          createdBy: ADMIN_UID,
        }),
      );
    });
  });

  describe('dishes', () => {
    it('denies unauthenticated read and write', async () => {
      await seedFixtures();
      const context = testEnv.unauthenticatedContext();
      const db = context.firestore();

      await assertFails(getDoc(doc(db, 'dishes', ACTIVE_DISH_ID)));
      await assertFails(setDoc(doc(db, 'dishes', 'new-dish'), pancakesDish));
    });

    it('allows an active user to read but not write dishes', async () => {
      await seedFixtures();
      const context = testEnv.authenticatedContext(USER_UID, { role: 'user', isActive: true });
      const db = context.firestore();

      await assertSucceeds(getDoc(doc(db, 'dishes', ACTIVE_DISH_ID)));
      await assertFails(setDoc(doc(db, 'dishes', 'new-dish'), pancakesDish));
      await assertFails(updateDoc(doc(db, 'dishes', ACTIVE_DISH_ID), { name: 'Hacked' }));
    });

    it('allows an active admin to create and update dishes', async () => {
      await seedFixtures();
      const context = testEnv.authenticatedContext(ADMIN_UID, { role: 'admin', isActive: true });
      const db = context.firestore();

      await assertSucceeds(
        setDoc(doc(db, 'dishes', 'dish-soup'), {
          ...pancakesDish,
          name: 'Tomato soup',
          recipeItems: [],
        }),
      );

      await assertSucceeds(
        updateDoc(doc(db, 'dishes', ACTIVE_DISH_ID), {
          name: 'Pancakes (updated)',
          description: pancakesDish.description,
          mealTypes: pancakesDish.mealTypes,
          recipeItems: pancakesDish.recipeItems,
          updatedAt: serverTimestamp(),
          updatedBy: ADMIN_UID,
        }),
      );

      await assertSucceeds(
        updateDoc(doc(db, 'dishes', ACTIVE_DISH_ID), {
          name: pancakesDish.name,
          description: pancakesDish.description,
          mealTypes: pancakesDish.mealTypes,
          recipeItems: pancakesDish.recipeItems,
          archivedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          updatedBy: ADMIN_UID,
        }),
      );

      await assertSucceeds(
        updateDoc(doc(db, 'dishes', ACTIVE_DISH_ID), {
          name: pancakesDish.name,
          description: pancakesDish.description,
          mealTypes: pancakesDish.mealTypes,
          recipeItems: pancakesDish.recipeItems,
          archivedAt: null,
          updatedAt: serverTimestamp(),
          updatedBy: ADMIN_UID,
        }),
      );
    });

    it('denies deleting a dish, even for an admin', async () => {
      await seedFixtures();
      const context = testEnv.authenticatedContext(ADMIN_UID, { role: 'admin', isActive: true });
      const db = context.firestore();

      await assertFails(deleteDoc(doc(db, 'dishes', ACTIVE_DISH_ID)));
    });

    it('rejects a dish write that violates the field allowlist or the mealTypes enum', async () => {
      await seedFixtures();
      const context = testEnv.authenticatedContext(ADMIN_UID, { role: 'admin', isActive: true });
      const db = context.firestore();

      await assertFails(
        setDoc(doc(db, 'dishes', 'dish-invalid'), {
          ...pancakesDish,
          mealTypes: ['brunch'],
        }),
      );
      await assertFails(
        setDoc(doc(db, 'dishes', 'dish-invalid-2'), {
          ...pancakesDish,
          extraField: 'not allowed',
        }),
      );
      await assertFails(
        setDoc(doc(db, 'dishes', 'dish-invalid-3'), {
          ...pancakesDish,
          archivedAt: 'not-a-timestamp',
        }),
      );
    });

    it('keeps ownership and creation fields immutable on update', async () => {
      await seedFixtures();
      const context = testEnv.authenticatedContext(ADMIN_UID, { role: 'admin', isActive: true });
      const db = context.firestore();

      await assertFails(
        updateDoc(doc(db, 'dishes', ACTIVE_DISH_ID), {
          createdBy: USER_UID,
          updatedAt: serverTimestamp(),
          updatedBy: ADMIN_UID,
        }),
      );
      await assertFails(
        updateDoc(doc(db, 'dishes', ACTIVE_DISH_ID), {
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          updatedBy: ADMIN_UID,
        }),
      );
    });
  });

  describe('preparedBatches', () => {
    it('denies unauthenticated read and write', async () => {
      await seedFixtures();
      const context = testEnv.unauthenticatedContext();
      const db = context.firestore();

      await assertFails(getDoc(doc(db, 'preparedBatches', AVAILABLE_BATCH_ID)));
      await assertFails(setDoc(doc(db, 'preparedBatches', 'new-batch'), availableBatch));
    });

    it('allows an active user to read but denies an arbitrary direct write', async () => {
      await seedFixtures();
      const context = testEnv.authenticatedContext(USER_UID, { role: 'user', isActive: true });
      const db = context.firestore();

      await assertSucceeds(getDoc(doc(db, 'preparedBatches', AVAILABLE_BATCH_ID)));
      await assertFails(setDoc(doc(db, 'preparedBatches', 'new-batch'), availableBatch));
      // Not a valid reservation move: availableQuantity increases instead of decreasing.
      await assertFails(
        updateDoc(doc(db, 'preparedBatches', AVAILABLE_BATCH_ID), {
          availableQuantity: 5,
          updatedAt: serverTimestamp(),
          updatedBy: USER_UID,
        }),
      );
    });

    it("allows an active user's transaction-shaped reservation move (available down, reserved up by the same amount)", async () => {
      await seedFixtures();
      const context = testEnv.authenticatedContext(USER_UID, { role: 'user', isActive: true });
      const db = context.firestore();

      // This is the exact single-document move `orderTransactions.reserveReadyOrder`
      // issues; docs/06 "Client-only limitations" — Rules validate this one
      // document's invariants but cannot verify the cross-document sum against
      // the order being created in the same transaction. TypeScript owns that.
      await assertSucceeds(
        updateDoc(doc(db, 'preparedBatches', AVAILABLE_BATCH_ID), {
          availableQuantity: 2,
          reservedQuantity: 2,
          status: 'available',
          updatedAt: serverTimestamp(),
          updatedBy: USER_UID,
        }),
      );
    });

    it('denies a zero-delta reservation "move" (T6.2): availableQuantity must strictly decrease', async () => {
      await seedFixtures();
      const context = testEnv.authenticatedContext(USER_UID, { role: 'user', isActive: true });
      const db = context.firestore();

      // Same shape as a valid reservation move, but availableQuantity and
      // reservedQuantity are unchanged — not a real reservation.
      await assertFails(
        updateDoc(doc(db, 'preparedBatches', AVAILABLE_BATCH_ID), {
          availableQuantity: 4,
          reservedQuantity: 0,
          updatedAt: serverTimestamp(),
          updatedBy: USER_UID,
        }),
      );
    });

    it("denies a user's move that changes an immutable field or breaks the counter-conservation delta", async () => {
      await seedFixtures();
      const context = testEnv.authenticatedContext(USER_UID, { role: 'user', isActive: true });
      const db = context.firestore();

      await assertFails(
        updateDoc(doc(db, 'preparedBatches', AVAILABLE_BATCH_ID), {
          availableQuantity: 2,
          reservedQuantity: 3,
          updatedAt: serverTimestamp(),
          updatedBy: USER_UID,
        }),
      );
      await assertFails(
        updateDoc(doc(db, 'preparedBatches', AVAILABLE_BATCH_ID), {
          availableQuantity: 2,
          reservedQuantity: 2,
          dishId: 'other-dish',
          updatedAt: serverTimestamp(),
          updatedBy: USER_UID,
        }),
      );
      await assertFails(
        updateDoc(doc(db, 'preparedBatches', AVAILABLE_BATCH_ID), {
          availableQuantity: 2,
          reservedQuantity: 2,
          updatedAt: serverTimestamp(),
          updatedBy: 'someone-else',
        }),
      );
    });

    it('allows an active admin to create and fully update a batch, but denies deletion', async () => {
      await seedFixtures();
      const context = testEnv.authenticatedContext(ADMIN_UID, { role: 'admin', isActive: true });
      const db = context.firestore();

      await assertSucceeds(setDoc(doc(db, 'preparedBatches', 'batch-admin'), availableBatch));
      await assertSucceeds(
        updateDoc(doc(db, 'preparedBatches', AVAILABLE_BATCH_ID), {
          availableQuantity: 0,
          discardedQuantity: 4,
          status: 'discarded',
          updatedAt: serverTimestamp(),
          updatedBy: ADMIN_UID,
        }),
      );
      await assertFails(deleteDoc(doc(db, 'preparedBatches', AVAILABLE_BATCH_ID)));
    });

    it("allows an active user's transaction-shaped cancellation move (available up, reserved down by the same amount)", async () => {
      await seedFixtures();
      await testEnv.withSecurityRulesDisabled(async context => {
        await setDoc(doc(context.firestore(), 'preparedBatches', AVAILABLE_BATCH_ID), {
          ...availableBatch,
          availableQuantity: 2,
          reservedQuantity: 2,
        });
      });

      const context = testEnv.authenticatedContext(USER_UID, { role: 'user', isActive: true });
      const db = context.firestore();

      // This is the exact single-document move `orderTransactions.cancelOrder`
      // issues for a `ready` order's allocation restore — the inverse of the
      // reservation move above.
      await assertSucceeds(
        updateDoc(doc(db, 'preparedBatches', AVAILABLE_BATCH_ID), {
          availableQuantity: 4,
          reservedQuantity: 0,
          status: 'available',
          updatedAt: serverTimestamp(),
          updatedBy: USER_UID,
        }),
      );
    });

    it('denies an inactive account from performing the same cancellation counter-restore move', async () => {
      await seedFixtures();
      await testEnv.withSecurityRulesDisabled(async context => {
        await setDoc(doc(context.firestore(), 'preparedBatches', AVAILABLE_BATCH_ID), {
          ...availableBatch,
          availableQuantity: 2,
          reservedQuantity: 2,
        });
      });

      const context = testEnv.authenticatedContext(INACTIVE_UID, { role: 'user', isActive: false });
      const db = context.firestore();

      await assertFails(
        updateDoc(doc(db, 'preparedBatches', AVAILABLE_BATCH_ID), {
          availableQuantity: 4,
          reservedQuantity: 0,
          status: 'available',
          updatedAt: serverTimestamp(),
          updatedBy: INACTIVE_UID,
        }),
      );
    });

    it('denies a cancellation-shaped move that breaks the counter delta, touches an immutable field, or forges the actor stamp', async () => {
      await seedFixtures();
      await testEnv.withSecurityRulesDisabled(async context => {
        await setDoc(doc(context.firestore(), 'preparedBatches', AVAILABLE_BATCH_ID), {
          ...availableBatch,
          availableQuantity: 2,
          reservedQuantity: 2,
        });
      });

      const context = testEnv.authenticatedContext(USER_UID, { role: 'user', isActive: true });
      const db = context.firestore();

      // Mismatched delta: reserved drops by 2 but available only rises by 1.
      await assertFails(
        updateDoc(doc(db, 'preparedBatches', AVAILABLE_BATCH_ID), {
          availableQuantity: 3,
          reservedQuantity: 0,
          updatedAt: serverTimestamp(),
          updatedBy: USER_UID,
        }),
      );
      // Immutable field changed alongside an otherwise-valid delta.
      await assertFails(
        updateDoc(doc(db, 'preparedBatches', AVAILABLE_BATCH_ID), {
          availableQuantity: 4,
          reservedQuantity: 0,
          dishName: 'Different dish',
          updatedAt: serverTimestamp(),
          updatedBy: USER_UID,
        }),
      );
      // Forged actor stamp.
      await assertFails(
        updateDoc(doc(db, 'preparedBatches', AVAILABLE_BATCH_ID), {
          availableQuantity: 4,
          reservedQuantity: 0,
          updatedAt: serverTimestamp(),
          updatedBy: 'someone-else',
        }),
      );
      // An arbitrary user write unrelated to any real move is still denied.
      await assertFails(
        updateDoc(doc(db, 'preparedBatches', AVAILABLE_BATCH_ID), {
          availableQuantity: 10,
          updatedAt: serverTimestamp(),
          updatedBy: USER_UID,
        }),
      );
    });

    it('rejects a batch write that breaks the conservation invariant or the field allowlist', async () => {
      await seedFixtures();
      const context = testEnv.authenticatedContext(ADMIN_UID, { role: 'admin', isActive: true });
      const db = context.firestore();

      await assertFails(
        setDoc(doc(db, 'preparedBatches', 'batch-invalid'), {
          ...availableBatch,
          producedQuantity: 4,
          availableQuantity: 3,
        }),
      );
      await assertFails(
        setDoc(doc(db, 'preparedBatches', 'batch-invalid-2'), {
          ...availableBatch,
          extraField: 'not allowed',
        }),
      );
      await assertFails(
        setDoc(doc(db, 'preparedBatches', 'batch-invalid-3'), {
          ...availableBatch,
          status: 'not-a-status',
        }),
      );
    });

    it('requires a positive integer batchNumber on create', async () => {
      await seedFixtures();
      const context = testEnv.authenticatedContext(ADMIN_UID, { role: 'admin', isActive: true });
      const db = context.firestore();

      await assertSucceeds(
        setDoc(doc(db, 'preparedBatches', 'batch-valid-number'), { ...availableBatch, batchNumber: 2 }),
      );

      const withoutBatchNumber: Record<string, unknown> = { ...availableBatch };
      delete withoutBatchNumber.batchNumber;
      await assertFails(setDoc(doc(db, 'preparedBatches', 'batch-missing-number'), withoutBatchNumber));
      await assertFails(setDoc(doc(db, 'preparedBatches', 'batch-zero-number'), { ...availableBatch, batchNumber: 0 }));
      await assertFails(
        setDoc(doc(db, 'preparedBatches', 'batch-string-number'), { ...availableBatch, batchNumber: '1' }),
      );
    });

    it('denies an admin update that changes the immutable batchNumber', async () => {
      await seedFixtures();
      const context = testEnv.authenticatedContext(ADMIN_UID, { role: 'admin', isActive: true });
      const db = context.firestore();

      await assertFails(
        updateDoc(doc(db, 'preparedBatches', AVAILABLE_BATCH_ID), {
          batchNumber: 99,
          updatedAt: serverTimestamp(),
          updatedBy: ADMIN_UID,
        }),
      );
    });

    it("allows a user's reservation/cancellation move that keeps batchNumber equal, but denies one that changes it", async () => {
      await seedFixtures();
      const context = testEnv.authenticatedContext(USER_UID, { role: 'user', isActive: true });
      const db = context.firestore();

      await assertSucceeds(
        updateDoc(doc(db, 'preparedBatches', AVAILABLE_BATCH_ID), {
          availableQuantity: 2,
          reservedQuantity: 2,
          status: 'available',
          updatedAt: serverTimestamp(),
          updatedBy: USER_UID,
        }),
      );

      await assertFails(
        updateDoc(doc(db, 'preparedBatches', AVAILABLE_BATCH_ID), {
          availableQuantity: 1,
          reservedQuantity: 3,
          batchNumber: 55,
          status: 'available',
          updatedAt: serverTimestamp(),
          updatedBy: USER_UID,
        }),
      );
    });
  });

  describe('counters', () => {
    it('denies a non-admin write to counters/preparedBatchNumber but allows an active user to read it', async () => {
      await testEnv.withSecurityRulesDisabled(async context => {
        await setDoc(doc(context.firestore(), 'counters', 'preparedBatchNumber'), { value: 1 });
      });

      const context = testEnv.authenticatedContext(USER_UID, { role: 'user', isActive: true });
      const db = context.firestore();

      await assertSucceeds(getDoc(doc(db, 'counters', 'preparedBatchNumber')));
      await assertFails(setDoc(doc(db, 'counters', 'preparedBatchNumber'), { value: 2 }));
      await assertFails(updateDoc(doc(db, 'counters', 'preparedBatchNumber'), { value: 2 }));
    });

    it('allows an admin to create and strictly increment the counter, but denies a non-increasing update', async () => {
      const context = testEnv.authenticatedContext(ADMIN_UID, { role: 'admin', isActive: true });
      const db = context.firestore();

      await assertSucceeds(setDoc(doc(db, 'counters', 'preparedBatchNumber'), { value: 1 }));
      await assertSucceeds(updateDoc(doc(db, 'counters', 'preparedBatchNumber'), { value: 2 }));
      await assertFails(updateDoc(doc(db, 'counters', 'preparedBatchNumber'), { value: 2 }));
      await assertFails(updateDoc(doc(db, 'counters', 'preparedBatchNumber'), { value: 1 }));
    });

    it('denies deleting the counter and denies a malformed shape', async () => {
      const context = testEnv.authenticatedContext(ADMIN_UID, { role: 'admin', isActive: true });
      const db = context.firestore();

      await assertSucceeds(setDoc(doc(db, 'counters', 'preparedBatchNumber'), { value: 1 }));
      await assertFails(deleteDoc(doc(db, 'counters', 'preparedBatchNumber')));
      await assertFails(setDoc(doc(db, 'counters', 'otherCounter'), { value: 0 }));
      await assertFails(setDoc(doc(db, 'counters', 'otherCounter'), { value: 1, extra: 'nope' }));
    });
  });

  describe('orders', () => {
    it('denies unauthenticated read and write', async () => {
      await seedFixtures();
      const context = testEnv.unauthenticatedContext();
      const db = context.firestore();

      await assertFails(getDoc(doc(db, 'orders', 'order-1')));
      await assertFails(setDoc(doc(db, 'orders', 'order-1'), buildReadyOrder()));
    });

    it('allows an active user to create only their own order', async () => {
      await seedFixtures();
      const context = testEnv.authenticatedContext(USER_UID, { role: 'user', isActive: true });
      const db = context.firestore();

      await assertSucceeds(setDoc(doc(db, 'orders', 'order-mine'), buildReadyOrder()));
      await assertFails(setDoc(doc(db, 'orders', 'order-spoofed'), buildReadyOrder({ userId: ADMIN_UID })));
    });

    it('rejects an order create with an invalid enum, out-of-bounds quantity, or extra field', async () => {
      await seedFixtures();
      const context = testEnv.authenticatedContext(USER_UID, { role: 'user', isActive: true });
      const db = context.firestore();

      await assertFails(setDoc(doc(db, 'orders', 'order-bad-kind'), buildReadyOrder({ kind: 'brunch' })));
      await assertFails(setDoc(doc(db, 'orders', 'order-bad-status'), buildReadyOrder({ status: 'made-up' })));
      await assertFails(setDoc(doc(db, 'orders', 'order-bad-meal'), buildReadyOrder({ mealType: 'brunch' })));
      await assertFails(setDoc(doc(db, 'orders', 'order-bad-quantity'), buildReadyOrder({ quantity: 0 })));
      await assertFails(setDoc(doc(db, 'orders', 'order-bad-quantity-2'), buildReadyOrder({ quantity: 100 })));
      await assertFails(setDoc(doc(db, 'orders', 'order-extra-field'), buildReadyOrder({ extraField: 'nope' })));
    });

    it('rejects creating a ready order as pending, or a cook order with allocations', async () => {
      await seedFixtures();
      const context = testEnv.authenticatedContext(USER_UID, { role: 'user', isActive: true });
      const db = context.firestore();

      await assertFails(setDoc(doc(db, 'orders', 'order-ready-pending'), buildReadyOrder({ status: 'pending' })));
      await assertFails(
        setDoc(
          doc(db, 'orders', 'order-cook-with-allocations'),
          buildCookOrder({ allocations: [{ batchId: AVAILABLE_BATCH_ID, quantity: 1 }] }),
        ),
      );
      await assertSucceeds(setDoc(doc(db, 'orders', 'order-cook-valid'), buildCookOrder()));
    });

    it('allows a user to cancel their own reserved or pending order, changing only status and the update stamp', async () => {
      await seedFixtures();
      await testEnv.withSecurityRulesDisabled(async context => {
        await setDoc(doc(context.firestore(), 'orders', 'order-to-cancel'), buildReadyOrder());
        await setDoc(doc(context.firestore(), 'orders', 'order-request-to-cancel'), buildCookOrder());
      });

      const context = testEnv.authenticatedContext(USER_UID, { role: 'user', isActive: true });
      const db = context.firestore();

      await assertSucceeds(
        updateDoc(doc(db, 'orders', 'order-to-cancel'), {
          status: 'cancelled',
          updatedAt: serverTimestamp(),
          updatedBy: USER_UID,
        }),
      );
      await assertSucceeds(
        updateDoc(doc(db, 'orders', 'order-request-to-cancel'), {
          status: 'cancelled',
          updatedAt: serverTimestamp(),
          updatedBy: USER_UID,
        }),
      );
    });

    it('denies a user updating another user’s order, an illegal transition, or an immutable field', async () => {
      await seedFixtures();
      await testEnv.withSecurityRulesDisabled(async context => {
        await setDoc(doc(context.firestore(), 'orders', 'order-to-cancel'), buildReadyOrder());
        await setDoc(doc(context.firestore(), 'orders', OTHER_USER_ORDER_ID), buildReadyOrder({ userId: ADMIN_UID }));
      });

      const context = testEnv.authenticatedContext(USER_UID, { role: 'user', isActive: true });
      const db = context.firestore();

      await assertFails(
        updateDoc(doc(db, 'orders', OTHER_USER_ORDER_ID), {
          status: 'cancelled',
          updatedAt: serverTimestamp(),
          updatedBy: USER_UID,
        }),
      );
      await assertFails(
        updateDoc(doc(db, 'orders', 'order-to-cancel'), {
          status: 'consumed',
          updatedAt: serverTimestamp(),
          updatedBy: USER_UID,
        }),
      );
      await assertFails(
        updateDoc(doc(db, 'orders', 'order-to-cancel'), {
          quantity: 5,
          status: 'cancelled',
          updatedAt: serverTimestamp(),
          updatedBy: USER_UID,
        }),
      );
      await assertFails(
        updateDoc(doc(db, 'orders', 'order-to-cancel'), {
          userId: ADMIN_UID,
          status: 'cancelled',
          updatedAt: serverTimestamp(),
          updatedBy: USER_UID,
        }),
      );
    });

    it('allows an active admin full read/write over any order but never a physical delete', async () => {
      await seedFixtures();
      await testEnv.withSecurityRulesDisabled(async context => {
        await setDoc(doc(context.firestore(), 'orders', 'order-admin-managed'), buildCookOrder());
      });

      const context = testEnv.authenticatedContext(ADMIN_UID, { role: 'admin', isActive: true });
      const db = context.firestore();

      await assertSucceeds(getDoc(doc(db, 'orders', 'order-admin-managed')));
      await assertSucceeds(
        updateDoc(doc(db, 'orders', 'order-admin-managed'), {
          status: 'approved',
          updatedAt: serverTimestamp(),
          updatedBy: ADMIN_UID,
        }),
      );
      await assertFails(deleteDoc(doc(db, 'orders', 'order-admin-managed')));
    });

    it('allows an admin to drive the full cook-request lifecycle (approve, start cooking, complete with allocations, correct with a reason)', async () => {
      await seedFixtures();
      await testEnv.withSecurityRulesDisabled(async context => {
        await setDoc(doc(context.firestore(), 'orders', 'order-cook-lifecycle'), buildCookOrder());
      });

      const context = testEnv.authenticatedContext(ADMIN_UID, { role: 'admin', isActive: true });
      const db = context.firestore();

      await assertSucceeds(
        updateDoc(doc(db, 'orders', 'order-cook-lifecycle'), {
          status: 'approved',
          updatedAt: serverTimestamp(),
          updatedBy: ADMIN_UID,
        }),
      );
      await assertSucceeds(
        updateDoc(doc(db, 'orders', 'order-cook-lifecycle'), {
          status: 'cooking',
          updatedAt: serverTimestamp(),
          updatedBy: ADMIN_UID,
        }),
      );
      await assertSucceeds(
        updateDoc(doc(db, 'orders', 'order-cook-lifecycle'), {
          status: 'prepared',
          preparedBatchId: 'batch-from-cooking',
          allocations: [{ batchId: 'batch-from-cooking', quantity: 1 }],
          updatedAt: serverTimestamp(),
          updatedBy: ADMIN_UID,
        }),
      );
      // Audited correction: cancels with a stored reason.
      await assertSucceeds(
        updateDoc(doc(db, 'orders', 'order-cook-lifecycle'), {
          status: 'cancelled',
          rejectionReason: 'Batch spoiled before pickup',
          updatedAt: serverTimestamp(),
          updatedBy: ADMIN_UID,
        }),
      );
    });

    it('allows an admin to consume a reserved order (T5.8): moves the order to consumed and the allocated batch reserved->consumed', async () => {
      await seedFixtures();
      await testEnv.withSecurityRulesDisabled(async context => {
        await setDoc(
          doc(context.firestore(), 'orders', 'order-reserved-to-consume'),
          buildReadyOrder({ status: 'reserved' }),
        );
        await setDoc(doc(context.firestore(), 'preparedBatches', AVAILABLE_BATCH_ID), {
          ...availableBatch,
          availableQuantity: 2,
          reservedQuantity: 2,
        });
      });

      const context = testEnv.authenticatedContext(ADMIN_UID, { role: 'admin', isActive: true });
      const db = context.firestore();

      await assertSucceeds(
        updateDoc(doc(db, 'preparedBatches', AVAILABLE_BATCH_ID), {
          reservedQuantity: 0,
          consumedQuantity: 2,
          updatedAt: serverTimestamp(),
          updatedBy: ADMIN_UID,
        }),
      );
      await assertSucceeds(
        updateDoc(doc(db, 'orders', 'order-reserved-to-consume'), {
          status: 'consumed',
          updatedAt: serverTimestamp(),
          updatedBy: ADMIN_UID,
        }),
      );
    });
  });

  describe('settings/general', () => {
    it('denies unauthenticated read and write', async () => {
      await testEnv.withSecurityRulesDisabled(async context => {
        await setDoc(doc(context.firestore(), 'settings', 'general'), generalSettings);
      });
      const context = testEnv.unauthenticatedContext();
      const db = context.firestore();

      await assertFails(getDoc(doc(db, 'settings', 'general')));
      await assertFails(setDoc(doc(db, 'settings', 'general'), generalSettings));
    });

    it('allows an active user to read but not write settings', async () => {
      await seedFixtures();
      await testEnv.withSecurityRulesDisabled(async context => {
        await setDoc(doc(context.firestore(), 'settings', 'general'), generalSettings);
      });

      const context = testEnv.authenticatedContext(USER_UID, { role: 'user', isActive: true });
      const db = context.firestore();

      await assertSucceeds(getDoc(doc(db, 'settings', 'general')));
      await assertFails(
        updateDoc(doc(db, 'settings', 'general'), {
          defaultMealTimes: { breakfast: '07:00', lunch: '12:00', dinner: '18:00' },
          updatedAt: serverTimestamp(),
          updatedBy: USER_UID,
        }),
      );
    });

    it('allows an active admin to create and update settings with a valid payload', async () => {
      await seedFixtures();
      const context = testEnv.authenticatedContext(ADMIN_UID, { role: 'admin', isActive: true });
      const db = context.firestore();

      await assertSucceeds(setDoc(doc(db, 'settings', 'general'), generalSettings));
      await assertSucceeds(
        updateDoc(doc(db, 'settings', 'general'), {
          defaultMealTimes: { breakfast: '07:00', lunch: '12:00', dinner: '18:00' },
          updatedAt: serverTimestamp(),
          updatedBy: ADMIN_UID,
        }),
      );
    });

    it('rejects an admin settings write with a malformed meal time or an extra field', async () => {
      await seedFixtures();
      const context = testEnv.authenticatedContext(ADMIN_UID, { role: 'admin', isActive: true });
      const db = context.firestore();

      await assertFails(
        setDoc(doc(db, 'settings', 'general'), {
          ...generalSettings,
          defaultMealTimes: { breakfast: '8:00', lunch: '13:00', dinner: '19:00' },
        }),
      );
      await assertFails(setDoc(doc(db, 'settings', 'general'), { ...generalSettings, extraField: 'nope' }));
      await assertFails(deleteDoc(doc(db, 'settings', 'general')));
    });

    it('is not hardcoded to one timezone (T6.3): accepts another valid IANA zone, rejects an empty/malformed one', async () => {
      await seedFixtures();
      const context = testEnv.authenticatedContext(ADMIN_UID, { role: 'admin', isActive: true });
      const db = context.firestore();

      // A household outside Ukraine must be able to pick its own zone.
      await assertSucceeds(
        setDoc(doc(db, 'settings', 'general'), { ...generalSettings, timezone: 'America/New_York' }),
      );

      await assertFails(setDoc(doc(db, 'settings', 'general'), { ...generalSettings, timezone: '' }));
      await assertFails(setDoc(doc(db, 'settings', 'general'), { ...generalSettings, timezone: 'not a timezone!' }));
    });
  });
});
