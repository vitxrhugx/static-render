import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOrganization } from '@/hooks/use-organization';
import { Loader2 } from 'lucide-react';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { organization, isLoading } = useOrganization();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If not loading, no organization, and not already on organization page
    if (!isLoading && !organization && location.pathname !== '/organization') {
      navigate('/organization', { replace: true });
    }
  }, [organization, isLoading, navigate, location.pathname]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando organização...</p>
        </div>
      </div>
    );
  }

  // If on organization page, always render (to allow creation)
  if (location.pathname === '/organization') {
    return <>{children}</>;
  }

  // If no organization, don't render (will redirect)
  if (!organization) {
    return null;
  }

  return <>{children}</>;
}
