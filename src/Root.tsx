import { useEffect, useState } from 'react';
import App from './App';
import { AdminPage } from './components/AdminPage';
import { AppGuide } from './components/AppGuide';
import { parseGuideHash } from './utils/guideRoute';

export default function Root() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // The operator's statistics live at /#admin; the key is checked server-side
  if (hash === '#admin') return <AdminPage />;
  // The shareable app guide lives at /#app
  const guide = parseGuideHash(hash);
  if (guide) return <AppGuide section={guide.section} />;
  return <App />;
}
