import { LandingPage } from '../components/landing/LandingPage';

// Until F4 ships a real Home composition (pins + default dashboard + recent),
// we keep the polished landing hero as the front door. The NL prompt on it
// already routes into the v2 flow via useNLResolve on submit.
export function HomePage() {
  return <LandingPage />;
}
