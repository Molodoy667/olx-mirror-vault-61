import { useLocation } from 'react-router-dom';
import { UserBottomPanel } from '@/components/UserBottomPanel';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  
  // Не показываем UserBottomPanel на админских страницах
  const isAdminPage = location.pathname.startsWith('/admin');
  
  return (
    <>
      {children}
      {!isAdminPage && <UserBottomPanel />}
    </>
  );
}