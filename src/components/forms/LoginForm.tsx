'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '@/lib/validations/schemas';
import { useLogin } from '@/hooks';
import { ResponsiveForm, ResponsiveFormGroup, ResponsiveInput, ResponsiveButton } from '@/components/ResponsiveComponents';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface LoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, redirectTo }) => {
  const { mutate: login, isPending, error } = useLogin();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginFormData) => {
    login(data, {
      onSuccess: () => {
        if (onSuccess) {
          onSuccess();
        } else if (redirectTo) {
          window.location.href = redirectTo;
        } else {
          window.location.href = '/appboard';
        }
      },
    });
  };

  return (
    <Card className="modern-card w-full max-w-md mx-auto">
      <CardHeader className="text-center p-6 sm:p-8">
        <CardTitle className="text-2xl sm:text-3xl font-bold">Sign In</CardTitle>
        <CardDescription className="text-sm sm:text-base">
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 sm:p-8">
        <ResponsiveForm onSubmit={handleSubmit(onSubmit)}>
          <ResponsiveFormGroup>
            <ResponsiveInput
              id="email"
              type="email"
              label="Email"
              placeholder="Enter your email"
              error={errors.email?.message}
              {...control.register('email')}
            />
          </ResponsiveFormGroup>

          <ResponsiveFormGroup>
            <ResponsiveInput
              id="password"
              type="password"
              label="Password"
              placeholder="Enter your password"
              error={errors.password?.message}
              {...control.register('password')}
            />
          </ResponsiveFormGroup>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                {error.message || 'Failed to login. Please check your credentials.'}
              </AlertDescription>
            </Alert>
          )}

          <ResponsiveButton
            type="submit"
            variant="primary"
            size="md"
            loading={isPending}
            className="w-full"
          >
            {isPending ? 'Signing in...' : 'Sign In'}
          </ResponsiveButton>
        </ResponsiveForm>

        <div className="mt-6 text-center text-sm">
          <p className="text-muted-foreground">
            Don't have an account?{' '}
            <a href="/register" className="text-primary hover:underline">
              Sign up
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};