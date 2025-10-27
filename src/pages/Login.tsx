import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthForm } from '../components/auth/AuthForm';
import { useAuth } from '../hooks/useAuth';

export function Login() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return <AuthForm onSuccess={() => navigate('/dashboard')} />;
}
