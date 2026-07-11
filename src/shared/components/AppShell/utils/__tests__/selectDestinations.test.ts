import { describe, expect, it } from 'vitest';

import { selectDestinations } from '../selectDestinations';

describe('selectDestinations', () => {
  it('returns the full ordered destination set for admin', () => {
    const keys = selectDestinations('admin').map(destination => destination.key);

    expect(keys).toEqual(['menu', 'admin', 'orders', 'dishes', 'inventory', 'batches', 'settings']);
  });

  it('uses the catalog drawer label keys for the dashboard and admin-orders destinations', () => {
    const destinations = selectDestinations('admin');
    const dashboard = destinations.find(destination => destination.key === 'admin');
    const cookingRequests = destinations.find(destination => destination.key === 'orders');

    expect(dashboard?.labelKey).toBe('nav.dashboard');
    expect(cookingRequests?.labelKey).toBe('nav.cookingRequests');
  });

  it('returns exactly Menu and My orders for user', () => {
    const keys = selectDestinations('user').map(destination => destination.key);

    expect(keys).toEqual(['menu', 'myOrders']);
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
    expect(userKeys).not.toContain('settings');
  });
});
