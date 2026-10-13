import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/guards/PrivateRoute';
import AppLayout   from './components/layout/AppLayout';

// Auth
import LoginPage     from './pages/auth/LoginPage';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword  from './pages/auth/ResetPassword';

// Admin
import AdminDashboard    from './pages/admin/Dashboard';
import AdminEmployees    from './pages/admin/employees/EmployeeList';
import AdminEmployeeNew  from './pages/admin/employees/EmployeeForm';
import AdminEmployeeEdit from './pages/admin/employees/EmployeeEdit';
import AdminEmployeeView from './pages/admin/employees/EmployeeView';
import AdminDepartments  from './pages/admin/Departments';
import AdminTeams        from './pages/admin/Teams';
import AdminPositions    from './pages/admin/Positions';
import AdminTaskBoard    from './pages/admin/tasks/TaskBoard';
import AdminTaskNew      from './pages/admin/tasks/TaskForm';
import AdminTaskEdit     from './pages/admin/tasks/TaskEdit';
import AdminTaskView     from './pages/admin/tasks/TaskView';
import AdminAttendance   from './pages/admin/Attendance';
import AdminFiles        from './pages/admin/Files';
import AdminReports      from './pages/admin/Reports';
import AdminActivityLogs from './pages/admin/ActivityLogs';
import AdminNotifications from './pages/shared/Notifications';

// Manager
import ManagerDashboard    from './pages/manager/Dashboard';
import ManagerTaskBoard    from './pages/manager/tasks/TaskBoard';
import ManagerTaskNew      from './pages/manager/tasks/TaskForm';
import ManagerTaskEdit     from './pages/manager/tasks/TaskEdit';
import ManagerTaskView     from './pages/manager/tasks/TaskView';
import ManagerAttendance   from './pages/manager/Attendance';
import ManagerFiles        from './pages/manager/Files';
import ManagerReports      from './pages/manager/Reports';
import ManagerNotifications from './pages/shared/Notifications';

// Employee
import EmployeeDashboard    from './pages/employee/Dashboard';
import EmployeeTaskBoard    from './pages/employee/tasks/TaskBoard';
import EmployeeTaskView     from './pages/employee/tasks/TaskView';
import EmployeeAttendance   from './pages/employee/Attendance';
import EmployeeFiles        from './pages/employee/Files';
import EmployeeNotifications from './pages/shared/Notifications';

// Error
import NotFound   from './pages/errors/NotFound';
import Forbidden  from './pages/errors/Forbidden';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/login"           element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />
        <Route path="/"                element={<Navigate to="/login" replace />} />
        <Route path="/403"             element={<Forbidden />} />

        {/* Protected shell */}
        <Route element={<PrivateRoute />}>
          <Route element={<AppLayout />}>

            {/* ── Administrator ──────────────────────────────────────── */}
            <Route element={<PrivateRoute roles={['Administrator']} />}>
              <Route path="/admin/dashboard"      element={<AdminDashboard />} />
              <Route path="/admin/employees"      element={<AdminEmployees />} />
              <Route path="/admin/employees/new"  element={<AdminEmployeeNew />} />
              <Route path="/admin/employees/:id"  element={<AdminEmployeeView />} />
              <Route path="/admin/employees/:id/edit" element={<AdminEmployeeEdit />} />
              <Route path="/admin/departments"    element={<AdminDepartments />} />
              <Route path="/admin/teams"          element={<AdminTeams />} />
              <Route path="/admin/positions"      element={<AdminPositions />} />
              <Route path="/admin/tasks"          element={<AdminTaskBoard />} />
              <Route path="/admin/tasks/new"      element={<AdminTaskNew />} />
              <Route path="/admin/tasks/:id"      element={<AdminTaskView />} />
              <Route path="/admin/tasks/:id/edit" element={<AdminTaskEdit />} />
              <Route path="/admin/attendance"     element={<AdminAttendance />} />
              <Route path="/admin/files"          element={<AdminFiles />} />
              <Route path="/admin/reports"        element={<AdminReports />} />
              <Route path="/admin/activity-logs"  element={<AdminActivityLogs />} />
              <Route path="/admin/notifications"  element={<AdminNotifications />} />
            </Route>

            {/* ── Manager ────────────────────────────────────────────── */}
            <Route element={<PrivateRoute roles={['Manager']} />}>
              <Route path="/manager/dashboard"      element={<ManagerDashboard />} />
              <Route path="/manager/tasks"          element={<ManagerTaskBoard />} />
              <Route path="/manager/tasks/new"      element={<ManagerTaskNew />} />
              <Route path="/manager/tasks/:id"      element={<ManagerTaskView />} />
              <Route path="/manager/tasks/:id/edit" element={<ManagerTaskEdit />} />
              <Route path="/manager/attendance"     element={<ManagerAttendance />} />
              <Route path="/manager/files"          element={<ManagerFiles />} />
              <Route path="/manager/reports"        element={<ManagerReports />} />
              <Route path="/manager/notifications"  element={<ManagerNotifications />} />
            </Route>

            {/* ── Employee ───────────────────────────────────────────── */}
            <Route element={<PrivateRoute roles={['Employee']} />}>
              <Route path="/employee/dashboard"     element={<EmployeeDashboard />} />
              <Route path="/employee/tasks"         element={<EmployeeTaskBoard />} />
              <Route path="/employee/tasks/:id"     element={<EmployeeTaskView />} />
              <Route path="/employee/attendance"    element={<EmployeeAttendance />} />
              <Route path="/employee/files"         element={<EmployeeFiles />} />
              <Route path="/employee/notifications" element={<EmployeeNotifications />} />
            </Route>

          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}
