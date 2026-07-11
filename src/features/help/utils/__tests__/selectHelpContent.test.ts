import { describe, expect, it } from 'vitest';

import { selectHelpTopics, selectQuickStartSteps } from '../selectHelpContent';

describe('selectQuickStartSteps', () => {
  it('returns all four steps in order for admin', () => {
    const keys = selectQuickStartSteps('admin').map(step => step.key);

    expect(keys).toEqual(['browseMenu', 'reserveOrRequest', 'trackOrder', 'processRequests']);
  });

  it('returns the first three steps in order for user', () => {
    const keys = selectQuickStartSteps('user').map(step => step.key);

    expect(keys).toEqual(['browseMenu', 'reserveOrRequest', 'trackOrder']);
  });
});

describe('selectHelpTopics', () => {
  it('returns all eight topics in order for admin', () => {
    const keys = selectHelpTopics('admin').map(topic => topic.key);

    expect(keys).toEqual([
      'menuBrowse',
      'myOrders',
      'languageAndTheme',
      'cookingRequests',
      'dishesAndRecipes',
      'inventoryAndStock',
      'preparedBatches',
      'mealTimeSettings',
    ]);
  });

  it('returns exactly the three shared topics for user', () => {
    const keys = selectHelpTopics('user').map(topic => topic.key);

    expect(keys).toEqual(['menuBrowse', 'myOrders', 'languageAndTheme']);
  });

  it('never leaks an admin-only topic to user', () => {
    const userKeys = selectHelpTopics('user').map(topic => topic.key);

    expect(userKeys).not.toContain('cookingRequests');
    expect(userKeys).not.toContain('dishesAndRecipes');
    expect(userKeys).not.toContain('inventoryAndStock');
    expect(userKeys).not.toContain('preparedBatches');
    expect(userKeys).not.toContain('mealTimeSettings');
  });
});
