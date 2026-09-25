import { Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";

import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import Opportunities from "./pages/Opportunities";

import AdminRoute from "./admin/AdminRoute";
import AdminLayout from "./admin/AdminLayout";

import AdminDashboard from "./admin/pages/AdminDashboard";
import AdminUsers from "./admin/pages/AdminUsers";
import AdminTalent from "./admin/pages/AdminTalent";
import AdminOpportunities from "./admin/pages/AdminOpportunities";
import AdminProjects from "./admin/pages/AdminProject";
import AdminTransactions from "./admin/pages/AdminTransactions";
import AdminReports from "./admin/pages/AdminReports";
import AdminEarnings from "./admin/pages/AdminEarnings";
import AdminProjectVerification from "./admin/pages/AdminProjectVerification";

import TalentLayout from "./talent/TalentLayout";
import TalentDashboard from "./talent/pages/TalentDashboard";
import TalentDiscover from "./talent/pages/TalentDiscover";
import TalentMyApplications from "./talent/pages/TalentMyApplications";
import TalentMyProjects from "./talent/pages/TalentMyProject";
import TalentPortfolio from "./talent/pages/TalentPortfolio";
import TalentEarnings from "./talent/pages/TalentEarnings";

function App() {
  return (
    <Routes>

      {/* ===================================== */}
      {/* PUBLIC WEBSITE */}
      {/* ===================================== */}

      <Route element={<MainLayout />}>

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/auth/callback"
          element={<AuthCallback />}
        />

        <Route
  path="/opportunities"
  element={<Opportunities />}
/>

      </Route>


      {/* ===================================== */}
      {/* TALENT DASHBOARD */}
      {/* ===================================== */}

      <Route element={<TalentLayout />}>

        <Route
          path="/talent"
          element={<TalentDashboard />}
        />

        <Route
          path="/talent/opportunities"
          element={<TalentDiscover />}
        />

        <Route
          path="/talent/my-applications"
          element={<TalentMyApplications />}
        />

        <Route
          path="/talent/projects"
          element={<TalentMyProjects />}
        />

        <Route
          path="/talent/portfolio"
          element={<TalentPortfolio />}
        />

        <Route path="/talent/earnings" element={<TalentEarnings />} />

      </Route>


      {/* ===================================== */}
      {/* PROTECTED ADMIN PANEL */}
      {/* ===================================== */}

      <Route element={<AdminRoute />}>

        <Route element={<AdminLayout />}>

          <Route
            path="/admin"
            element={<AdminDashboard />}
          />

          <Route
            path="/admin/users"
            element={<AdminUsers />}
          />

          <Route
            path="/admin/talent"
            element={<AdminTalent />}
          />

          <Route
            path="/admin/jobs"
            element={<AdminOpportunities />}
          />

          <Route
            path="/admin/projects"
            element={<AdminProjects />}
          />

          <Route
            path="/admin/project-verification"
            element={<AdminProjectVerification />}
          />

          <Route
            path="/admin/transactions"
            element={<AdminTransactions />}
          />

          <Route
            path="/admin/reports"
            element={<AdminReports />}
          />

          <Route
  path="/admin/earnings"
  element={<AdminEarnings />}
/>

        </Route>

      </Route>

    </Routes>
  );
}

export default App;

