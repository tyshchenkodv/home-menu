import { describe, expect, it } from 'vitest';

import { selectDestinations } from '../selectDestinations';

describe('selectDestinations', () => {
  it('returns the full ordered destination set for admin', () => {
    const keys = selectDestinations('admin').map(destination => destination.key);

    expect(keys).toEqual(['menu', 'orders', 'admin', 'inventory', 'batches', 'dishes', 'settings']);
  });

  it('returns exactly Menu, My orders, and Settings for user', () => {
    const keys = selectDestinations('user').map(destination => destination.key);

    expect(keys).toEqual(['menu', 'myOrders', 'settings']);
  });

  it('never leaks a destination to a role it does not list', () => {
    const adminKeys = selectDestinations('admin').map(destination => destination.key);
    const userKeys = selectDestinations('user').map(destination => destination.key);

    expect(adminKeys).not.toContain('myOrders');
    expect(userKeys).not.toContain('admin');
    expect(userKeys).not.toContain('orders');
    expect(userKeys).not.toContain('inventory');
    expect(userKeys).not.toContain('batches');
    expect(userKeys).not.toContain('dishes');
  });
});
