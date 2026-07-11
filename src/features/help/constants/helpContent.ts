import Inventory2 from '@mui/icons-material/Inventory2';
import LightMode from '@mui/icons-material/LightMode';
import LocalDining from '@mui/icons-material/LocalDining';
import ReceiptLong from '@mui/icons-material/ReceiptLong';
import RestaurantMenu from '@mui/icons-material/RestaurantMenu';
import Settings from '@mui/icons-material/Settings';
import SoupKitchen from '@mui/icons-material/SoupKitchen';

import type { HelpTopicSection, QuickStartStep } from '../types/helpContent';

/**
 * Every quick-start step in declared display order. `selectQuickStartSteps`
 * filters this list by role; order is preserved for the step list.
 */
export const quickStartSteps: QuickStartStep[] = [
  {
    key: 'browseMenu',
    titleKey: 'help.quickStart.steps.browseMenu.title',
    bodyKey: 'help.quickStart.steps.browseMenu.body',
    roles: ['admin', 'user'],
  },
  {
    key: 'reserveOrRequest',
    titleKey: 'help.quickStart.steps.reserveOrRequest.title',
    bodyKey: 'help.quickStart.steps.reserveOrRequest.body',
    roles: ['admin', 'user'],
  },
  {
    key: 'trackOrder',
    titleKey: 'help.quickStart.steps.trackOrder.title',
    bodyKey: 'help.quickStart.steps.trackOrder.body',
    roles: ['admin', 'user'],
  },
  {
    key: 'processRequests',
    titleKey: 'help.quickStart.steps.processRequests.title',
    bodyKey: 'help.quickStart.steps.processRequests.body',
    roles: ['admin'],
  },
];

/**
 * Every Help topic section in declared display order. `selectHelpTopics`
 * filters this list by role; order is preserved for the topic accordion.
 */
export const helpTopicSections: HelpTopicSection[] = [
  {
    key: 'menuBrowse',
    titleKey: 'help.topics.menuBrowse.title',
    descriptionKey: 'help.topics.menuBrowse.description',
    Icon: RestaurantMenu,
    roles: ['admin', 'user'],
  },
  {
    key: 'myOrders',
    titleKey: 'help.topics.myOrders.title',
    descriptionKey: 'help.topics.myOrders.description',
    Icon: ReceiptLong,
    roles: ['admin', 'user'],
  },
  {
    key: 'languageAndTheme',
    titleKey: 'help.topics.languageAndTheme.title',
    descriptionKey: 'help.topics.languageAndTheme.description',
    Icon: LightMode,
    roles: ['admin', 'user'],
  },
  {
    key: 'cookingRequests',
    titleKey: 'help.topics.cookingRequests.title',
    descriptionKey: 'help.topics.cookingRequests.description',
    Icon: ReceiptLong,
    roles: ['admin'],
  },
  {
    key: 'dishesAndRecipes',
    titleKey: 'help.topics.dishesAndRecipes.title',
    descriptionKey: 'help.topics.dishesAndRecipes.description',
    Icon: LocalDining,
    roles: ['admin'],
  },
  {
    key: 'inventoryAndStock',
    titleKey: 'help.topics.inventoryAndStock.title',
    descriptionKey: 'help.topics.inventoryAndStock.description',
    Icon: Inventory2,
    roles: ['admin'],
  },
  {
    key: 'preparedBatches',
    titleKey: 'help.topics.preparedBatches.title',
    descriptionKey: 'help.topics.preparedBatches.description',
    Icon: SoupKitchen,
    roles: ['admin'],
  },
  {
    key: 'mealTimeSettings',
    titleKey: 'help.topics.mealTimeSettings.title',
    descriptionKey: 'help.topics.mealTimeSettings.description',
    Icon: Settings,
    roles: ['admin'],
  },
];
