'use client';

import { useRouter } from 'next/navigation';
import { useAppForm } from '@/components/ui/tanstack-form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import * as z from 'zod';
import { useAuthStore } from '@/stores/auth-store';

const loginSchema = z.object({
  login: z.string().min(1, { message: 'Username or email is required' }),
  password: z.string().min(1, { message: 'Password is required' })
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuthStore();

  const form = useAppForm({
    defaultValues: {
      login: '',
      password: ''
    } as LoginFormValues,
    validators: {
      onSubmit: loginSchema
    },
    onSubmit: async ({ value }) => {
      try {
        await login(value.login, value.password);
        toast.success('Login successful!');
        router.push('/dashboard/overview');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Login failed');
      }
    }
  });

  return (
    <div className='relative flex min-h-screen flex-col items-center justify-center overflow-hidden md:grid lg:max-w-none lg:grid-cols-2 lg:px-0'>
      {/* Left side - decorative panel */}
      <div className='bg-muted relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r'>
        <div className='absolute inset-0 bg-zinc-900' />
        <div className='relative z-20 flex items-center text-lg font-medium'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='mr-2 h-6 w-6'
          >
            <path d='M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3' />
          </svg>
          Logo
        </div>
        <div className='relative z-20 mt-auto'>
          <blockquote className='space-y-2'>
            <p className='text-lg'>
              &ldquo;CRM System for managing customers and interactions.&rdquo;
            </p>
            <footer className='text-sm'>Your Company</footer>
          </blockquote>
        </div>
      </div>

      {/* Right side - login form */}
      <div className='flex h-full items-center justify-center p-4 lg:p-8'>
        <div className='flex w-full max-w-md flex-col items-center justify-center space-y-6'>
          <div className='w-full space-y-2'>
            <h1 className='text-2xl font-bold tracking-tight'>Welcome back</h1>
            <p className='text-muted-foreground text-sm'>
              Enter your credentials to access your account
            </p>
          </div>

          <form.AppForm>
            <form.Form className='w-full space-y-4'>
              <form.AppField
                name='login'
                children={(field) => (
                  <field.FieldSet>
                    <field.Field>
                      <field.FieldLabel htmlFor={field.name}>Email or Username</field.FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type='text'
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder='Enter your email or username'
                        aria-invalid={field.state.meta.isTouched && !field.state.meta.isValid}
                      />
                    </field.Field>
                    <field.FieldError />
                  </field.FieldSet>
                )}
              />

              <form.AppField
                name='password'
                children={(field) => (
                  <field.FieldSet>
                    <field.Field>
                      <field.FieldLabel htmlFor={field.name}>Password</field.FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type='password'
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder='Enter your password'
                        aria-invalid={field.state.meta.isTouched && !field.state.meta.isValid}
                      />
                    </field.Field>
                    <field.FieldError />
                  </field.FieldSet>
                )}
              />

              <form.SubmitButton className='w-full'>
                Sign In
              </form.SubmitButton>
            </form.Form>
          </form.AppForm>

          <div className='text-muted-foreground px-8 text-center text-sm'>
            <p>
              This is a secure system. Access is restricted to authorized personnel only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
