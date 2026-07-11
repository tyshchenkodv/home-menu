import type { PreparedBatchWithId } from '../../../shared/types/preparedBatch';

export interface ExpiredBatchBannerProps {
  /** The expired, non-discarded batches backing one dish (non-empty). */
  batches: PreparedBatchWithId[];
}
