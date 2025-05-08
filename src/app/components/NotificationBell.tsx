export default function NotificationBell({ hasNotifications }: { hasNotifications: boolean }) {
  return (
    <button className="btn btn-link position-relative">
      <i className="bi bi-bell text-light"></i>
      {hasNotifications && <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
      <span className="visually-hidden">New alerts</span>
      </span>}
    </button>
  );
}
