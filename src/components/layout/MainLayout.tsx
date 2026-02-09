import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { ScrollToTop } from '@/components/ui/scroll-to-top';

export function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <div className="flex flex-1">
        <Outlet />
      </div>
      <ScrollToTop />
    </div>
  );
}
