import { BrowserRouter, Routes, Route } from "react-router-dom";

import OpeningPage from "./opening_page";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AccountsCreate from "./pages/AccountsCreate";
function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<OpeningPage />} />

        <Route
          path="/admin/login"
          element={<AdminLogin />}
        />
        <Route
  path="/admin/dashboard"
  element={<AdminDashboard />}
/>
<Route
  path="/admin/accounts/create"
  element={<AccountsCreate />}
/>

      </Routes>
    </BrowserRouter>
  );
}

export default App;