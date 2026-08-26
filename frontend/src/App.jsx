import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import DashboardPage from "./pages/DashboardPage";
import DocumentsPage from "./pages/DocumentsPage";
import UploadDocumentPage from "./pages/UploadDocumentPage";
import DocumentDetailsPage from "./pages/DocumentDetailsPage";
import FoldersPage from "./pages/FoldersPage";
import CategoriesPage from "./pages/CategoriesPage";
import UsersPage from "./pages/UsersPage";
import UserDetailsPage from "./pages/UserDetailsPage";
import RolesPage from "./pages/RolesPage";
import AuditLogsPage from "./pages/AuditLogsPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import "./App.css";
import "./Categories_cards.css";
import "./Folders_cards.css";

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* All application routes require authentication */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />

        {/* Documents */}
        <Route
          path="/documents"
          element={
            <ProtectedRoute permission="document.view">
              <DocumentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents/mine"
          element={
            <ProtectedRoute permission="document.view">
              <DocumentsPage mine />
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents/upload"
          element={
            <ProtectedRoute permission="document.create">
              <UploadDocumentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents/:id"
          element={
            <ProtectedRoute permission="document.view">
              <DocumentDetailsPage />
            </ProtectedRoute>
          }
        />

        {/* Categories and category-owned folders */}
        <Route
          path="/categories"
          element={
            <ProtectedRoute permission="category.view">
              <CategoriesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/categories/:categoryId"
          element={
            <ProtectedRoute permission="category.view">
              <FoldersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/categories/:categoryId/folders/:id"
          element={
            <ProtectedRoute permission="category.view">
              <FoldersPage />
            </ProtectedRoute>
          }
        />

        {/* General folder library */}
        <Route
          path="/folders"
          element={
            <ProtectedRoute permission="folder.view">
              <FoldersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/folders/:id"
          element={
            <ProtectedRoute permission="folder.view">
              <FoldersPage />
            </ProtectedRoute>
          }
        />

        {/* User and administration pages */}
        <Route
          path="/users"
          element={
            <ProtectedRoute permission="user.view">
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route path="/users/:id" element={<UserDetailsPage />} />
        <Route
          path="/administrators"
          element={
            <ProtectedRoute permission="admin.view">
              <UsersPage adminMode />
            </ProtectedRoute>
          }
        />
        <Route
          path="/roles"
          element={
            <ProtectedRoute permission="role.view">
              <RolesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute permission="audit.view">
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
