import { loadDominiosData } from '@/lib/data';
import Dashboard from '@/components/Dashboard';

// This runs on the server (build time on Vercel).
// It reads data/dominios.csv and passes parsed records to the client component.
export default function Home() {
  const data = loadDominiosData();
  return <Dashboard data={data} />;
}
