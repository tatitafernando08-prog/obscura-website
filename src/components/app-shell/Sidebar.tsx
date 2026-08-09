import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  {
    to: '/app/dashboard',
    label: 'Home',
    path: 'M4 11.5 12 4l8 7.5M6 10v9a1 1 0 0 0 1 1h4v-6h2v6h4a1 1 0 0 0 1-1v-9',
  },
  {
    to: '/app/focus-room',
    label: 'Focus Room',
    path: 'M12 8v4l3 2M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  },
  {
    to: '/app/chat',
    label: 'AI Chat',
    path: 'M4 5.5C4 4.67 4.67 4 5.5 4h13c.83 0 1.5.67 1.5 1.5v9c0 .83-.67 1.5-1.5 1.5H9l-4 4v-4H5.5C4.67 16 4 15.33 4 14.5v-9Z',
  },
  {
    to: '/app/planner',
    label: 'Planner',
    path: 'M4 5h16v15H4z M4 9.5h16 M8 3v3.2M16 3v3.2',
  },
  {
    to: '/app/progress',
    label: 'Progress',
    path: 'M5 19V10M12 19V5M19 19v-7',
  },
  {
    to: '/app/settings',
    label: 'Settings',
    path: 'M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM19.4 12a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-2.1-1.2L14.4 3h-4.8l-.4 2.6a7.6 7.6 0 0 0-2.1 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1c.6.5 1.3.9 2.1 1.2l.4 2.6h4.8l.4-2.6c.8-.3 1.5-.7 2.1-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z',
  },
];

export function Sidebar() {
  const { signOut } = useAuth();

  return (
    <aside className="app-sidebar">
      <NavLink to="/app/dashboard" className="logo">
        <img src="/assets/logo.png" alt="Obscura logo" />
      </NavLink>

      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `app-nav-item${isActive ? ' active' : ''}`}
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d={item.path} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {item.label}
        </NavLink>
      ))}

      <div className="app-sidebar-footer">
        <button
          type="button"
          className="app-nav-item"
          onClick={() => signOut()}
          style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3M15 16l4-4-4-4M19 12H9" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></svg>
          Log Out
        </button>
      </div>
    </aside>
  );
}
