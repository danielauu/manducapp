import { Home } from './screens/Home';
import { Journal } from './screens/Journal';
import { OwnText } from './screens/OwnText';
import { Preview } from './screens/Preview';
import { Session } from './screens/Session';
import { Settings } from './screens/Settings';
import { Spike } from './screens/Spike';
import { AppProvider } from './state/AppContext';
import { useRoute } from './useRoute';

function Screens() {
  const route = useRoute();
  switch (route) {
    case 'preview':
      return <Preview />;
    case 'session':
      return <Session />;
    case 'journal':
      return <Journal />;
    case 'settings':
      return <Settings />;
    case 'own':
      return <OwnText />;
    case 'spike':
      return <Spike />;
    case 'home':
      return <Home />;
  }
}

export function App() {
  return (
    <AppProvider>
      <Screens />
    </AppProvider>
  );
}
