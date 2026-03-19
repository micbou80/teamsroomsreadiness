'use server';

import { signIn } from '@/lib/auth';

export async function signInWithMicrosoft(formData: FormData) {
  const callbackUrl = formData.get('callbackUrl') as string | null;
  await signIn('microsoft-entra-id', { redirectTo: callbackUrl || '/assessment' });
}
