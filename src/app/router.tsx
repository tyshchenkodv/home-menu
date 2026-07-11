import { HashRouter, Route, Routes } from 'react-router-dom';

import { AppShell } from '../shared/components/AppShell/AppShell';
import { LoginPage } from '../features/auth/LoginPage';
import { RequireActiveProfile } from '../features/auth/RequireActiveProfile';
import { RequireAdmin } from '../features/auth/RequireAdmin';
import { AdminDashboardPage } from '../features/admin-dashboard/pages/AdminDashboardPage';
import { DishesPage } from '../features/admin-dishes/pages/DishesPage';
import { InventoryHistoryPage } from '../features/admin-inventory/pages/InventoryHistoryPage';
import { InventoryPage } from '../features/admin-inventory/pages/InventoryPage';
import { AdminOrdersPage } from '../features/admin-orders/pages/AdminOrdersPage';
import { BatchesPage } from '../features/batches/pages/BatchesPage';
import { ForbiddenPage } from '../features/errors/ForbiddenPage';
import { NotFoundPage } from '../features/errors/NotFoundPage';
import { HelpPage } from '../features/help/pages/HelpPage';
import { MenuPage } from '../features/menu/pages/MenuPage';
import { OrdersPage } from '../features/orders/pages/OrdersPage';
import { SettingsPage } from '../features/settings/pages/SettingsPage';
import { RootRedirect } from './RootRedirect';

export const AppRouter = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/403" element={<ForbiddenPage />} />
        <Route
          element={
            <RequireActiveProfile>
              <AppShell />
            </RequireActiveProfile>
          }
        >
          <Route index element={<RootRedirect />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route
            path="/settings"
            element={
              <RequireAdmin>
                <SettingsPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminDashboardPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <RequireAdmin>
                <AdminOrdersPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/batches"
            element={
              <RequireAdmin>
                <BatchesPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/dishes"
            element={
              <RequireAdmin>
                <DishesPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/inventory"
            element={
              <RequireAdmin>
                <InventoryPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/inventory/history"
            element={
              <RequireAdmin>
                <InventoryHistoryPage />
              </RequireAdmin>
            }
          />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </HashRouter>
  );
};
