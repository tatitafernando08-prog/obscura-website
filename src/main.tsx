import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import './style.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <div>Obscura — auth wired</div>
    </AuthProvider>
  </StrictMode>
);
