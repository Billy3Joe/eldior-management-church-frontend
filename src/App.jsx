import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import {
  SubscriptionProvider,
} from "./context/SubscriptionContext";

import Login from "./pages/Login";
import RegisterChurch from "./pages/RegisterChurch";

import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";
import PlatformRoute from "./components/PlatformRoute";
import SubscriptionRoute from "./components/SubscriptionRoute";

import Dashboard from "./pages/Dashboard";

import Members from "./pages/Members";
import MemberProfile from "./pages/MemberProfile";

import Families from "./pages/Families";

import Groups from "./pages/Groups";
import GroupDetails from "./pages/GroupDetails";

import Departments from "./pages/Departments";
import DepartmentDetails from "./pages/DepartmentDetails";

import Events from "./pages/Events";
import EventDetails from "./pages/EventDetails";

import Attendance from "./pages/Attendance";
import AttendanceStats from "./pages/AttendanceStats";

import PastoralStatistics from "./pages/PastoralStatistics";
import VisitorFollowUp from "./pages/VisitorFollowUp";
import PastoralAlerts from "./pages/PastoralAlerts";

import Assignments from "./pages/Assignments";
import AssignmentResponse from "./pages/AssignmentResponse";

import Reports from "./pages/Reports";

// ======================================================
// FINANCES
// ======================================================

import FinanceDashboard from "./pages/finance/FinanceDashboard";
import FinanceAccounts from "./pages/finance/FinanceAccounts";
import FinanceCategories from "./pages/finance/FinanceCategories";
import FinanceTransactions from "./pages/finance/FinanceTransactions";
import FinanceBudgets from "./pages/finance/FinanceBudgets";
import FinanceReconciliation from "./pages/finance/FinanceReconciliation";

import Settings from "./pages/Settings";

import AdminUsers from "./pages/AdminUsers";
import ActivityLogs from "./pages/ActivityLogs";

import Subscription from "./pages/Subscription";

import PlatformDashboard from "./pages/PlatformDashboard";
import PlatformChurches from "./pages/PlatformChurches";

function App() {
  return (
    <BrowserRouter>
      <SubscriptionProvider>
        <Routes>

          {/* ==================================================
              RACINE
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
              AUTHENTIFICATION
          ================================================== */}

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register-church"
            element={<RegisterChurch />}
          />

          {/* ==================================================
              DASHBOARD
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

          <Route
            path="/members/:id"
            element={
              <PrivateRoute>
                <MemberProfile />
              </PrivateRoute>
            }
          />

          {/* ==================================================
              FAMILLES
          ================================================== */}

          <Route
            path="/families"
            element={
              <PrivateRoute>
                <Families />
              </PrivateRoute>
            }
          />

          {/* ==================================================
              GROUPES / CELLULES
          ================================================== */}

          <Route
            path="/groups"
            element={
              <PrivateRoute>
                <Groups />
              </PrivateRoute>
            }
          />

          <Route
            path="/groups/:id"
            element={
              <PrivateRoute>
                <GroupDetails />
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

          <Route
            path="/departments/:id"
            element={
              <PrivateRoute>
                <DepartmentDetails />
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

          <Route
            path="/attendance-stats"
            element={
              <PrivateRoute>
                <AttendanceStats />
              </PrivateRoute>
            }
          />

          {/* ==================================================
              SUIVI PASTORAL
          ================================================== */}

          <Route
            path="/pastoral-statistics"
            element={
              <PrivateRoute>
                <PastoralStatistics />
              </PrivateRoute>
            }
          />

          <Route
            path="/visitor-follow-up"
            element={
              <PrivateRoute>
                <VisitorFollowUp />
              </PrivateRoute>
            }
          />

          <Route
            path="/pastoral-alerts"
            element={
              <PrivateRoute>
                <PastoralAlerts />
              </PrivateRoute>
            }
          />

          {/* ==================================================
              AFFECTATIONS
          ================================================== */}

          <Route
            path="/assignments"
            element={
              <PrivateRoute>
                <SubscriptionRoute feature="assignments">
                  <Assignments />
                </SubscriptionRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/assignment-response/:token"
            element={<AssignmentResponse />}
          />

          {/* ==================================================
              RAPPORTS
          ================================================== */}

          <Route
            path="/reports"
            element={
              <PrivateRoute>
                <SubscriptionRoute feature="reports">
                  <Reports />
                </SubscriptionRoute>
              </PrivateRoute>
            }
          />

          {/* ==================================================
              FINANCES
          ================================================== */}

          <Route
            path="/finance"
            element={
              <PrivateRoute>
                <FinanceDashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/finance/accounts"
            element={
              <PrivateRoute>
                <FinanceAccounts />
              </PrivateRoute>
            }
          />

          <Route
            path="/finance/categories"
            element={
              <PrivateRoute>
                <FinanceCategories />
              </PrivateRoute>
            }
          />

          <Route
            path="/finance/transactions"
            element={
              <PrivateRoute>
                <FinanceTransactions />
              </PrivateRoute>
            }
          />

          <Route
            path="/finance/budgets"
            element={
              <PrivateRoute>
                <FinanceBudgets />
              </PrivateRoute>
            }
          />

          <Route
            path="/finance/reconciliation"
            element={
              <PrivateRoute>
                <AdminRoute>
                  <FinanceReconciliation />
                </AdminRoute>
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
              UTILISATEURS
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
                  <SubscriptionRoute feature="activityLogs">
                    <ActivityLogs />
                  </SubscriptionRoute>
                </AdminRoute>
              </PrivateRoute>
            }
          />

          {/* ==================================================
              ESPACE PLATEFORME
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
      </SubscriptionProvider>
    </BrowserRouter>
  );
}

export default App;