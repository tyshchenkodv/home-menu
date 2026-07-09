import { Navigate, HashRouter, Route, Routes } from 'react-router-dom';

import { LoginPage } from '../features/auth/LoginPage';
import { RequireAdmin } from '../features/auth/RequireAdmin';
import { RequireAuth } from '../features/auth/RequireAuth';
import { AdminHomePage } from '../features/admin-inventory/pages/AdminHomePage';
import { InventoryHistoryPage } from '../features/admin-inventory/pages/InventoryHistoryPage';
import { InventoryPage } from '../features/admin-inventory/pages/InventoryPage';

export const AppRouter = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/inventory" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <RequireAdmin>
                <AdminHomePage />
              </RequireAdmin>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/inventory"
          element={
            <RequireAuth>
              <RequireAdmin>
                <InventoryPage />
              </RequireAdmin>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/inventory/history"
          element={
            <RequireAuth>
              <RequireAdmin>
                <InventoryHistoryPage />
              </RequireAdmin>
            </RequireAuth>
          }
        />
      </Routes>
    </HashRouter>
  );
};
