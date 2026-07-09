import type { InventoryMovementWithId } from '../../../shared/types/inventoryMovement';

export type MovementDayKind = 'today' | 'yesterday' | 'other';

export interface MovementDayGroup {
  /** Whether this group is the reference day, the previous day, or an earlier day. */
  kind: MovementDayKind;
  /** Midnight (local time) of the group's calendar day. */
  date: Date;
  movements: InventoryMovementWithId[];
}

const startOfDay = (millis: number): number => {
  const date = new Date(millis);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

const MILLIS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Groups movements by calendar day derived from `createdAt`, preserving the
 * incoming order both across and within groups. `referenceMillis` (defaults
 * to now) determines which group is "today" and which is "yesterday".
 */
export const groupMovementsByDay = (
  movements: InventoryMovementWithId[],
  referenceMillis: number = Date.now(),
): MovementDayGroup[] => {
  const todayStart = startOfDay(referenceMillis);
  const yesterdayStart = todayStart - MILLIS_PER_DAY;

  const groups: MovementDayGroup[] = [];
  const groupByDayStart = new Map<number, MovementDayGroup>();

  for (const movement of movements) {
    const dayStart = startOfDay(movement.createdAt.toMillis());
    let group = groupByDayStart.get(dayStart);

    if (!group) {
      const kind: MovementDayKind =
        dayStart === todayStart ? 'today' : dayStart === yesterdayStart ? 'yesterday' : 'other';
      group = { kind, date: new Date(dayStart), movements: [] };
      groupByDayStart.set(dayStart, group);
      groups.push(group);
    }

    group.movements.push(movement);
  }

  return groups;
};
