import { BatchDomainError, type BatchErrorCode } from '../../domain/batches/errors';
import { OrderDomainError, type OrderErrorCode } from '../../domain/orders/errors';
import {
  OrderTransactionError,
  type OrderTransactionErrorCode,
} from '../../infrastructure/firebase/services/orderTransactions';

const BATCH_CODE_TO_TRANSLATION_KEY: Record<BatchErrorCode, string> = {
  'batch/invalid-quantity': 'validation.quantityAtLeastOne',
  'batch/insufficient-available': 'menu.reservation.error.body',
  'batch/negative-counter': 'common.error',
  'batch/conservation-violated': 'common.error',
};

const ORDER_CODE_TO_TRANSLATION_KEY: Record<OrderErrorCode, string> = {
  'order/invalid-transition': 'common.error',
  'order/cancel-not-allowed': 'common.error',
  'order/correction-reason-required': 'validation.correctionReasonRequired',
  'order/invalid-quantity': 'validation.quantityAtLeastOne',
  'order/invalid-meal-time': 'common.error',
  'order/date-out-of-window': 'validation.dateNotInPast',
};

const TRANSACTION_CODE_TO_TRANSLATION_KEY: Record<OrderTransactionErrorCode, string> = {
  'order/dish-not-configured': 'menu.card.recipeNotConfigured',
  'order/dish-not-found': 'common.error',
  'order/not-found': 'common.error',
  'order/not-owned': 'common.error',
  'order/invalid-yield': 'validation.number',
  'order/insufficient-inventory': 'common.error',
  'order/yield-below-requested': 'orders.admin.completeCooking.yieldBelowRequested',
};

/**
 * Maps a thrown error to a translation key, keeping the localization
 * boundary from `docs/04-business-logic.md`: domain and transaction code
 * only ever throws stable English error codes, and this is the single place
 * that turns a code into a key for i18next. Anything unrecognized (network
 * failures, infrastructure errors) falls back to the generic error message.
 */
export function resolveErrorTranslationKey(error: unknown): string {
  if (error instanceof BatchDomainError) {
    return BATCH_CODE_TO_TRANSLATION_KEY[error.code];
  }

  if (error instanceof OrderDomainError) {
    return ORDER_CODE_TO_TRANSLATION_KEY[error.code];
  }

  if (error instanceof OrderTransactionError) {
    return TRANSACTION_CODE_TO_TRANSLATION_KEY[error.code];
  }

  return 'common.error';
}
