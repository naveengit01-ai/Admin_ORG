import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Opening Page
import OpeningPage from "./opening_page.jsx";

// Admin Authentication
import AdminLogin from "./pages/GMLogin.jsx";

// GM Pages
import AdminDashboard from "./pages/GM/AdminDashboard.jsx";
import AdminManagement from "./pages/GM/AdminsManagement.jsx";
import Reports from "./pages/GM/Reports.jsx";
import CreateAdmin from "./pages/GM/CreateAdmin.jsx";

// Responsibilities
import CreateRider from "./pages/Responsibilities/CreateRider.jsx";
import GMLogin from "./pages/GMLogin.jsx";

import CreatePromotion from "./pages/Responsibilities/CreatePromotion";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Opening Page */}
        <Route
          path="/"
          element={<OpeningPage />}
        />

        {/* Admin Login */}
        <Route
          path="/admin/login"
          element={<GMLogin />}
        />

        {/* GM Dashboard */}
        <Route
          path="/admin/dashboard"
          element={<AdminDashboard />}
        />

        {/* Admin Management */}
        <Route
          path="/admin/admin-management"
          element={<AdminManagement />}
        />

        {/* Organization Reports */}
        <Route
          path="/admin/reports"
          element={<Reports />}
        />

        {/* Create Administrator */}
        <Route
          path="/admin/accounts/create"
          element={<CreateAdmin />}
        />

        {/* Create Rider */}
        <Route
          path="/admin/create-rider"
          element={<CreateRider />}
        />

        {/* Unknown Routes */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
        <Route
  path="/admin/create-promotion"
  element={<CreatePromotion />}
/>

      </Routes>
    </BrowserRouter>
  );
}

export default App;