import { redirect } from 'next/navigation';

export default async function Dashboard() {
  // Auth is handled by middleware - /dashboard/* routes are protected
  // This page simply redirects to dashboard overview
  redirect('/dashboard/overview');
}
