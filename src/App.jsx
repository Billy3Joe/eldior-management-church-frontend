import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// ======================================================
// AUTHENTIFICATION
// ======================================================

import Login from "./pages/Login";
import RegisterChurch from "./pages/RegisterChurch";

// ======================================================
// PROTECTION DES ROUTES
// ======================================================

import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";
import PlatformRoute from "./components/PlatformRoute";

// ======================================================
// PAGES ÉGLISE
// ======================================================

import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import Departments from "./pages/Departments";
import Events from "./pages/Events";
import EventDetails from "./pages/EventDetails";
import Attendance from "./pages/Attendance";
import Assignments from "./pages/Assignments";
import AssignmentResponse from "./pages/AssignmentResponse";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import AdminUsers from "./pages/AdminUsers";
import ActivityLogs from "./pages/ActivityLogs";
import Subscription from "./pages/Subscription";

// ======================================================
// PAGES PLATEFORME
// ======================================================

import PlatformDashboard from "./pages/PlatformDashboard";
import PlatformChurches from "./pages/PlatformChurches";

// ======================================================
// APPLICATION
// ======================================================

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ==================================================
            ACCUEIL
        ================================================== */}

        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

        {/* ==================================================
            LOGIN
        ================================================== */}

        <Route
          path="/login"
          element={
            <Login />
          }
        />

        {/* ==================================================
            CRÉATION ÉGLISE
        ================================================== */}

        <Route
          path="/register-church"
          element={
            <RegisterChurch />
          }
        />

        {/* ==================================================
            DASHBOARD ÉGLISE
        ================================================== */}

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        {/* ==================================================
            MEMBRES
        ================================================== */}

        <Route
          path="/members"
          element={
            <PrivateRoute>
              <Members />
            </PrivateRoute>
          }
        />

        {/* ==================================================
            DÉPARTEMENTS
        ================================================== */}

        <Route
          path="/departments"
          element={
            <PrivateRoute>
              <Departments />
            </PrivateRoute>
          }
        />

        {/* ==================================================
            ÉVÉNEMENTS
        ================================================== */}

        <Route
          path="/events"
          element={
            <PrivateRoute>
              <Events />
            </PrivateRoute>
          }
        />

        <Route
          path="/events/:id"
          element={
            <PrivateRoute>
              <EventDetails />
            </PrivateRoute>
          }
        />

        {/* ==================================================
            PRÉSENCES
        ================================================== */}

        <Route
          path="/attendance"
          element={
            <PrivateRoute>
              <Attendance />
            </PrivateRoute>
          }
        />

        {/* ==================================================
            PROGRAMMATIONS
        ================================================== */}

        <Route
          path="/assignments"
          element={
            <PrivateRoute>
              <Assignments />
            </PrivateRoute>
          }
        />

        {/* ==================================================
            RÉPONSE PUBLIQUE
        ================================================== */}

        <Route
          path="/assignment-response/:token"
          element={
            <AssignmentResponse />
          }
        />

        {/* ==================================================
            RAPPORTS
        ================================================== */}

        <Route
          path="/reports"
          element={
            <PrivateRoute>
              <Reports />
            </PrivateRoute>
          }
        />

        {/* ==================================================
            ABONNEMENT
        ================================================== */}

        <Route
          path="/subscription"
          element={
            <PrivateRoute>
              <Subscription />
            </PrivateRoute>
          }
        />

        {/* ==================================================
            PARAMÈTRES
        ================================================== */}

        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          }
        />

        {/* ==================================================
            UTILISATEURS ÉGLISE
        ================================================== */}

        <Route
          path="/users"
          element={
            <PrivateRoute>
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            </PrivateRoute>
          }
        />

        {/* ==================================================
            JOURNAL D'ACTIVITÉ
        ================================================== */}

        <Route
          path="/activity-logs"
          element={
            <PrivateRoute>
              <AdminRoute>
                <ActivityLogs />
              </AdminRoute>
            </PrivateRoute>
          }
        />

        {/* ==================================================
            PLATEFORME - DASHBOARD
        ================================================== */}

        <Route
          path="/platform"
          element={
            <PrivateRoute>
              <PlatformRoute>
                <PlatformDashboard />
              </PlatformRoute>
            </PrivateRoute>
          }
        />

        {/* ==================================================
            PLATEFORME - ÉGLISES CLIENTES
        ================================================== */}

        <Route
          path="/platform/churches"
          element={
            <PrivateRoute>
              <PlatformRoute>
                <PlatformChurches />
              </PlatformRoute>
            </PrivateRoute>
          }
        />

        {/* ==================================================
            ROUTE INCONNUE
        ================================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;