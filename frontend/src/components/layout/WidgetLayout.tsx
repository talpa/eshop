import { Outlet } from 'react-router-dom';

export default function WidgetLayout() {
  return (
    <div className="min-h-screen bg-white flex items-start justify-center p-4">
      <Outlet />
    </div>
  );
}
