import { useEffect, useState } from 'react';
import App from './App';
import { AdminPage } from './components/AdminPage';

// The operator's statistics live at /#admin; the key is checked server-side
const isAdminHash = () => window.location.hash === '#admin';

export default function Root() {
  const [isAdmin, setIsAdmin] = useState(isAdminHash);
  useEffect(() => {
    const onHashChange = () => setIsAdmin(isAdminHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  return isAdmin ? <AdminPage /> : <App />;
}
