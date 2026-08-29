import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import Departments from "./pages/Departments";
import Events from "./pages/Events";
import Attendance from "./pages/Attendance";
import EventDetails from "./pages/EventDetails";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import AdminUsers from "./pages/AdminUsers";
import ActivityLogs from "./pages/ActivityLogs";
import Assignments from "./pages/Assignments";
import AssignmentResponse from "./pages/AssignmentResponse";

import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ========================================= */}
        {/* PUBLIC */}
        {/* ========================================= */}

        <Route path="/" element={<Login />} />

        <Route
          path="/assignment-response/:token"
          element={<AssignmentResponse />}
        />

        {/* ========================================= */}
        {/* DASHBOARD */}
        {/* ========================================= */}

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        {/* ========================================= */}
        {/* MEMBRES */}
        {/* ========================================= */}

        <Route
          path="/members"
          element={
            <PrivateRoute>
              <Members />
            </PrivateRoute>
          }
        />

        {/* ========================================= */}
        {/* DÉPARTEMENTS */}
        {/* ========================================= */}

        <Route
          path="/departments"
          element={
            <PrivateRoute>
              <Departments />
            </PrivateRoute>
          }
        />

        {/* ========================================= */}
        {/* ÉVÉNEMENTS */}
        {/* ========================================= */}

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

        {/* ========================================= */}
        {/* PRÉSENCES */}
        {/* ========================================= */}

        <Route
          path="/attendance"
          element={
            <PrivateRoute>
              <Attendance />
            </PrivateRoute>
          }
        />

        {/* ========================================= */}
        {/* PROGRAMMATIONS */}
        {/* ADMIN + MANAGER */}
        {/* ========================================= */}

        <Route
          path="/assignments"
          element={
            <PrivateRoute>
              <Assignments />
            </PrivateRoute>
          }
        />

        {/* ========================================= */}
        {/* RAPPORTS */}
        {/* ========================================= */}

        <Route
          path="/reports"
          element={
            <PrivateRoute>
              <Reports />
            </PrivateRoute>
          }
        />

        {/* ========================================= */}
        {/* PARAMÈTRES */}
        {/* ========================================= */}

        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          }
        />

        {/* ========================================= */}
        {/* ADMIN USERS */}
        {/* ADMIN UNIQUEMENT */}
        {/* ========================================= */}

        <Route
          path="/admin-users"
          element={
            <AdminRoute>
              <AdminUsers />
            </AdminRoute>
          }
        />

        {/* ========================================= */}
        {/* JOURNAL ACTIVITÉ */}
        {/* ADMIN UNIQUEMENT */}
        {/* ========================================= */}

        <Route
          path="/activity-logs"
          element={
            <AdminRoute>
              <ActivityLogs />
            </AdminRoute>
          }
        />
      </Routes>

      <ToastContainer
        position="top-right"
        autoClose={2500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="light"
      />
    </BrowserRouter>
  );
}