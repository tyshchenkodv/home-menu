import { describe, expect, it } from 'vitest';
import type { OrderStatus, OrderTransitionAction } from '../types';
import { canTransitionOrder } from '../canTransitionOrder';

const TERMINAL_STATUSES: OrderStatus[] = ['rejected', 'cancelled', 'consumed'];
const NON_TERMINAL_STATUSES: OrderStatus[] = ['reserved', 'pending', 'approved', 'cooking', 'prepared'];

describe('canTransitionOrder', () => {
  it('allows admin approve from pending to approved', () => {
    expect(canTransitionOrder('pending', 'approved', 'approve')).toBe(true);
  });

  it('allows admin reject from pending to rejected', () => {
    expect(canTransitionOrder('pending', 'rejected', 'reject')).toBe(true);
  });

  it('allows admin startCooking from approved to cooking', () => {
    expect(canTransitionOrder('approved', 'cooking', 'startCooking')).toBe(true);
  });

  it('allows admin completeCooking from cooking to prepared', () => {
    expect(canTransitionOrder('cooking', 'prepared', 'completeCooking')).toBe(true);
  });

  it('allows user cancel from pending to cancelled', () => {
    expect(canTransitionOrder('pending', 'cancelled', 'userCancel')).toBe(true);
  });

  it('allows user cancel from approved to cancelled', () => {
    expect(canTransitionOrder('approved', 'cancelled', 'userCancel')).toBe(true);
  });

  it('allows user cancel from reserved to cancelled', () => {
    expect(canTransitionOrder('reserved', 'cancelled', 'userCancel')).toBe(true);
  });

  it('forbids user cancel from cooking onward', () => {
    expect(canTransitionOrder('cooking', 'cancelled', 'userCancel')).toBe(false);
    expect(canTransitionOrder('prepared', 'cancelled', 'userCancel')).toBe(false);
  });

  it('allows normalize from reserved to consumed', () => {
    expect(canTransitionOrder('reserved', 'consumed', 'normalize')).toBe(true);
  });

  it('allows normalize from prepared to consumed', () => {
    expect(canTransitionOrder('prepared', 'consumed', 'normalize')).toBe(true);
  });

  it('forbids normalize from any other status', () => {
    expect(canTransitionOrder('pending', 'consumed', 'normalize')).toBe(false);
    expect(canTransitionOrder('approved', 'consumed', 'normalize')).toBe(false);
    expect(canTransitionOrder('cooking', 'consumed', 'normalize')).toBe(false);
  });

  it('allows an admin correction to cancel from any non-terminal status', () => {
    for (const from of NON_TERMINAL_STATUSES) {
      expect(canTransitionOrder(from, 'cancelled', 'adminCorrection')).toBe(true);
    }
  });

  it('forbids an admin correction from any terminal status', () => {
    for (const from of TERMINAL_STATUSES) {
      expect(canTransitionOrder(from, 'cancelled', 'adminCorrection')).toBe(false);
    }
  });

  it('forbids an admin correction to a status other than cancelled', () => {
    expect(canTransitionOrder('pending', 'approved', 'adminCorrection')).toBe(false);
  });

  it('forbids approve from a non-pending status', () => {
    expect(canTransitionOrder('approved', 'approved', 'approve')).toBe(false);
    expect(canTransitionOrder('cooking', 'approved', 'approve')).toBe(false);
  });

  it('forbids startCooking from a non-approved status', () => {
    expect(canTransitionOrder('pending', 'cooking', 'startCooking')).toBe(false);
  });

  it('forbids completeCooking from a non-cooking status', () => {
    expect(canTransitionOrder('approved', 'prepared', 'completeCooking')).toBe(false);
  });

  it('forbids any transition out of a terminal status other than adminCorrection', () => {
    const actions: OrderTransitionAction[] = [
      'approve',
      'reject',
      'startCooking',
      'completeCooking',
      'userCancel',
      'normalize',
    ];
    for (const terminal of TERMINAL_STATUSES) {
      for (const action of actions) {
        expect(canTransitionOrder(terminal, 'pending', action)).toBe(false);
      }
    }
  });
});
