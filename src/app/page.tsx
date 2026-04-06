import { redirect } from 'next/navigation';

export default async function Page() {
  // Auth is handled by middleware - protect /dashboard/* routes
  // This page simply redirects to dashboard overview
  redirect('/dashboard/overview');
}
