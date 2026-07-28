import { redirect } from 'next/navigation';

export default async function Page() {
  // Redirect root URL directly to sign-in page
  redirect('/auth/sign-in');
}
