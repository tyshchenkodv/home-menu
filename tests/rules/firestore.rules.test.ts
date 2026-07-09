import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { Timestamp, addDoc, collection, deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { afterAll, afterEach, beforeAll, describe, it } from 'vitest';

/**
 * Firestore Security Rules matrix for the admin inventory foundation slice.
 * Runs against the Firestore emulator started by
 * `firebase emulators:exec --only firestore` (see `firebase.json` and the
 * `test:rules` npm script). This suite requires Java 21+ locally; it is not
 * part of `npm test` (see `vitest.rules.config.ts`).
 *
 * Synthetic-only identities: `test-admin-uid`, `test-user-uid`,
 * `test-inactive-uid`, `test-unprovisioned-uid`, and `*.example.test`
 * emails. No real UIDs, emails, or project IDs appear here (see
 * docs/06-auth-and-security.md, "Initial provisioning").
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

const ADMIN_UID = 'test-admin-uid';
const ADMIN_EMAIL = 'admin@example.test';
const USER_UID = 'test-user-uid';
const USER_EMAIL = 'user@example.test';
const INACTIVE_UID = 'test-inactive-uid';
const INACTIVE_EMAIL = 'inactive@example.test';
const UNPROVISIONED_UID = 'test-unprovisioned-uid';
const UNPROVISIONED_EMAIL = 'unprovisioned@example.test';

const ACTIVE_INGREDIENT_ID = 'ingredient-flour';

const now = Timestamp.now();

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

async function seedProfilesAndIngredient(): Promise<void> {
  await testEnv.withSecurityRulesDisabled(async context => {
    const db = context.firestore();

    await setDoc(doc(db, 'users', ADMIN_UID), {
      displayName: 'Test Admin',
      email: ADMIN_EMAIL,
      role: 'admin',
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    await setDoc(doc(db, 'users', USER_UID), {
      displayName: 'Test User',
      email: USER_EMAIL,
      role: 'user',
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    await setDoc(doc(db, 'users', INACTIVE_UID), {
      displayName: 'Test Inactive',
      email: INACTIVE_EMAIL,
      role: 'user',
      active: false,
      createdAt: now,
      updatedAt: now,
    });

    await setDoc(doc(db, 'ingredients', ACTIVE_INGREDIENT_ID), quantityIngredient);
  });
}

describe('firestore.rules', () => {
  describe('unauthenticated access', () => {
    it('denies reading users, ingredients, and movements', async () => {
      await seedProfilesAndIngredient();
      const context = testEnv.unauthenticatedContext();
      const db = context.firestore();

      await assertFails(getDoc(doc(db, 'users', ADMIN_UID)));
      await assertFails(getDoc(doc(db, 'ingredients', ACTIVE_INGREDIENT_ID)));
      await assertFails(getDoc(doc(db, 'inventoryMovements', 'movement-1')));
    });

    it('denies writing ingredients and movements', async () => {
      await seedProfilesAndIngredient();
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
    it('denies reading and writing ingredients and movements', async () => {
      await seedProfilesAndIngredient();
      const context = testEnv.authenticatedContext(UNPROVISIONED_UID, { email: UNPROVISIONED_EMAIL });
      const db = context.firestore();

      await assertFails(getDoc(doc(db, 'ingredients', ACTIVE_INGREDIENT_ID)));
      await assertFails(getDoc(doc(db, 'inventoryMovements', 'movement-1')));
      await assertFails(updateDoc(doc(db, 'ingredients', ACTIVE_INGREDIENT_ID), { name: 'Hacked' }));
    });

    it('may read only its own (nonexistent) user document, not others', async () => {
      await seedProfilesAndIngredient();
      const context = testEnv.authenticatedContext(UNPROVISIONED_UID, { email: UNPROVISIONED_EMAIL });
      const db = context.firestore();

      await assertFails(getDoc(doc(db, 'users', ADMIN_UID)));
    });
  });

  describe('inactive account', () => {
    it('denies reading and writing ingredients and movements', async () => {
      await seedProfilesAndIngredient();
      const context = testEnv.authenticatedContext(INACTIVE_UID, { email: INACTIVE_EMAIL });
      const db = context.firestore();

      await assertFails(getDoc(doc(db, 'ingredients', ACTIVE_INGREDIENT_ID)));
      await assertFails(getDoc(doc(db, 'inventoryMovements', 'movement-1')));
      await assertFails(updateDoc(doc(db, 'ingredients', ACTIVE_INGREDIENT_ID), { name: 'Hacked' }));
    });

    it('may still read its own user document', async () => {
      await seedProfilesAndIngredient();
      const context = testEnv.authenticatedContext(INACTIVE_UID, { email: INACTIVE_EMAIL });
      const db = context.firestore();

      await assertSucceeds(getDoc(doc(db, 'users', INACTIVE_UID)));
    });
  });

  describe('role "user" (active, non-admin)', () => {
    it('may read ingredients but not inventory movements', async () => {
      await seedProfilesAndIngredient();
      const context = testEnv.authenticatedContext(USER_UID, { email: USER_EMAIL });
      const db = context.firestore();

      await assertSucceeds(getDoc(doc(db, 'ingredients', ACTIVE_INGREDIENT_ID)));
      await assertFails(getDoc(doc(db, 'inventoryMovements', 'movement-1')));
    });

    it('is denied ingredient writes', async () => {
      await seedProfilesAndIngredient();
      const context = testEnv.authenticatedContext(USER_UID, { email: USER_EMAIL });
      const db = context.firestore();

      await assertFails(setDoc(doc(db, 'ingredients', 'new-ingredient'), quantityIngredient));
      await assertFails(updateDoc(doc(db, 'ingredients', ACTIVE_INGREDIENT_ID), { name: 'Hacked' }));
    });

    it('is denied inventory movement creation', async () => {
      await seedProfilesAndIngredient();
      const context = testEnv.authenticatedContext(USER_UID, { email: USER_EMAIL });
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
      await seedProfilesAndIngredient();
      const context = testEnv.authenticatedContext(USER_UID, { email: USER_EMAIL });
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
      await seedProfilesAndIngredient();
      const context = testEnv.authenticatedContext(ADMIN_UID, { email: ADMIN_EMAIL });
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
          updatedAt: Timestamp.now(),
          updatedBy: ADMIN_UID,
        }),
      );

      await assertSucceeds(
        updateDoc(doc(db, 'ingredients', ACTIVE_INGREDIENT_ID), {
          archivedAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          updatedBy: ADMIN_UID,
        }),
      );

      await assertSucceeds(
        updateDoc(doc(db, 'ingredients', ACTIVE_INGREDIENT_ID), {
          archivedAt: null,
          updatedAt: Timestamp.now(),
          updatedBy: ADMIN_UID,
        }),
      );
    });

    it('can create inventory movements', async () => {
      await seedProfilesAndIngredient();
      const context = testEnv.authenticatedContext(ADMIN_UID, { email: ADMIN_EMAIL });
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
      await seedProfilesAndIngredient();
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

      const context = testEnv.authenticatedContext(ADMIN_UID, { email: ADMIN_EMAIL });
      const db = context.firestore();

      await assertFails(updateDoc(doc(db, 'inventoryMovements', 'movement-1'), { note: 'edited' }));
      await assertFails(deleteDoc(doc(db, 'inventoryMovements', 'movement-1')));
    });

    it('cannot delete an ingredient', async () => {
      await seedProfilesAndIngredient();
      const context = testEnv.authenticatedContext(ADMIN_UID, { email: ADMIN_EMAIL });
      const db = context.firestore();

      await assertFails(deleteDoc(doc(db, 'ingredients', ACTIVE_INGREDIENT_ID)));
    });

    it('cannot create a users/{uid} document or change a role', async () => {
      await seedProfilesAndIngredient();
      const context = testEnv.authenticatedContext(ADMIN_UID, { email: ADMIN_EMAIL });
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
      await seedProfilesAndIngredient();
      const context = testEnv.authenticatedContext(ADMIN_UID, { email: ADMIN_EMAIL });
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
      await seedProfilesAndIngredient();
      const context = testEnv.authenticatedContext(ADMIN_UID, { email: ADMIN_EMAIL });
      const db = context.firestore();

      await assertFails(
        addDoc(collection(db, 'inventoryMovements'), {
          ingredientId: ACTIVE_INGREDIENT_ID,
          ingredientName: 'Flour',
          type: 'cooking',
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
  });
});
