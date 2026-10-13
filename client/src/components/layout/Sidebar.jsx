import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NavItem = ({ to, icon, label, badge }) => (
  <NavLink to={to}
    className={({ isActive }) =>
      `nav-link d-flex align-items-center gap-2 px-3 py-2 rounded-0 text-decoration-none
       ${isActive ? 'active' : ''}`}
    style={({ isActive }) => ({
      color: isActive ? '#fff' : 'rgba(255,255,255,.65)',
      background: isActive ? 'rgba(255,255,255,.09)' : 'transparent',
      borderLeft: isActive ? '3px solid #4f46e5' : '3px solid transparent',
      fontSize: '.875rem',
      transition: 'all .15s',
    })}
  >
    <i className={`bi ${icon}`} style={{ width: 18, textAlign: 'center', fontSize: '1rem' }}></i>
    <span>{label}</span>
    {badge > 0 && (
      <span className="badge bg-danger ms-auto rounded-pill" style={{ fontSize: '.6rem' }}>
        {badge > 9 ? '9+' : badge}
      </span>
    )}
  </NavLink>
);

const Section = ({ label }) => (
  <div style={{ fontSize: '.65rem', fontWeight: 700, letterSpacing: '.1em', color: 'rgba(255,255,255,.3)', padding: '1.1rem 1.25rem .4rem', textTransform: 'uppercase' }}>
    {label}
  </div>
);

export default function Sidebar({ unread = 0 }) {
  const { user, logout } = useAuth();
  const role = user?.role;
  const initial = (user?.name?.[0] ?? user?.username?.[0] ?? '?').toUpperCase();

  return (
    <nav id="sidebar" style={{
      position: 'fixed', top: 0, left: 0, width: 250, height: '100vh',
      background: '#1e1b4b', display: 'flex', flexDirection: 'column', zIndex: 1040,
    }}>
      {/* Brand */}
      <div className="d-flex align-items-center gap-2 px-3 py-3 border-bottom"
           style={{ borderColor: 'rgba(255,255,255,.08) !important' }}>
        <div className="rounded-2 d-flex align-items-center justify-content-center"
             style={{ width: 32, height: 32, background: '#4f46e5' }}>
          <i className="bi bi-diagram-3-fill text-white" style={{ fontSize: '.9rem' }}></i>
        </div>
        <span className="text-white fw-bold" style={{ fontSize: '1.05rem' }}>Flowline</span>
      </div>

      {/* Scrollable nav */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,.15) transparent' }}>
        {role === 'Administrator' && <>
          <Section label="Main" />
          <NavItem to="/admin/dashboard"    icon="bi-speedometer2"        label="Dashboard" />
          <Section label="Organization" />
          <NavItem to="/admin/employees"    icon="bi-people-fill"         label="Employees" />
          <NavItem to="/admin/departments"  icon="bi-building"            label="Departments" />
          <NavItem to="/admin/teams"        icon="bi-people"              label="Teams" />
          <NavItem to="/admin/positions"    icon="bi-briefcase-fill"      label="Positions" />
          <Section label="Workflow" />
          <NavItem to="/admin/tasks"        icon="bi-kanban-fill"         label="Task Board" />
          <NavItem to="/admin/attendance"   icon="bi-calendar-check-fill" label="Attendance" />
          <NavItem to="/admin/files"        icon="bi-folder2-open"        label="Files" />
          <Section label="Insights" />
          <NavItem to="/admin/reports"      icon="bi-bar-chart-fill"      label="Reports" />
          <NavItem to="/admin/activity-logs" icon="bi-journal-text"       label="Audit Log" />
          <NavItem to="/admin/notifications" icon="bi-bell-fill"          label="Notifications" badge={unread} />
        </>}

        {role === 'Manager' && <>
          <Section label="Main" />
          <NavItem to="/manager/dashboard"      icon="bi-speedometer2"        label="Dashboard" />
          <Section label="Workflow" />
          <NavItem to="/manager/tasks"          icon="bi-kanban-fill"         label="Task Board" />
          <NavItem to="/manager/tasks/new"      icon="bi-plus-circle-fill"    label="Assign Task" />
          <NavItem to="/manager/attendance"     icon="bi-calendar-check-fill" label="Attendance" />
          <NavItem to="/manager/files"          icon="bi-folder2-open"        label="Files" />
          <Section label="Insights" />
          <NavItem to="/manager/reports"        icon="bi-bar-chart-fill"      label="Reports" />
          <NavItem to="/manager/notifications"  icon="bi-bell-fill"           label="Notifications" badge={unread} />
        </>}

        {role === 'Employee' && <>
          <Section label="Main" />
          <NavItem to="/employee/dashboard"     icon="bi-speedometer2"        label="Dashboard" />
          <Section label="My Work" />
          <NavItem to="/employee/tasks"         icon="bi-kanban-fill"         label="My Tasks" />
          <NavItem to="/employee/attendance"    icon="bi-calendar-check-fill" label="Attendance" />
          <NavItem to="/employee/files"         icon="bi-folder2-open"        label="Files" />
          <NavItem to="/employee/notifications" icon="bi-bell-fill"           label="Notifications" badge={unread} />
        </>}
      </div>

      {/* Footer */}
      <div className="p-3 border-top d-flex align-items-center gap-2"
           style={{ borderColor: 'rgba(255,255,255,.08)', borderTopWidth: 1, borderTopStyle: 'solid' }}>
        <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
             style={{ width: 34, height: 34, background: '#4f46e5', fontSize: '.8rem' }}>
          {initial}
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="text-white fw-semibold text-truncate" style={{ fontSize: '.82rem' }}>
            {user?.name ?? user?.username}
          </div>
          <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.45)' }}>{role}</div>
        </div>
        <button onClick={logout} className="btn btn-sm p-0 ms-auto border-0 bg-transparent"
                title="Logout" style={{ color: 'rgba(255,255,255,.4)' }}>
          <i className="bi bi-box-arrow-right fs-5"></i>
        </button>
      </div>
    </nav>
  );
}
