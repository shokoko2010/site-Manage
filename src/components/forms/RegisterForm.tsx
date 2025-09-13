'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterFormData } from '@/lib/validations/schemas';
import { useRegister } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface RegisterFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, redirectTo }) => {
  const { mutate: register, isPending, error } = useRegister();

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      username: '',
      password: '',
      name: '',
    },
  });

  const password = watch('password');

  const onSubmit = (data: RegisterFormData) => {
    register(data, {
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
    <Card className="modern-card w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
        <CardDescription className="text-center">
          Sign up to start managing your content
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  className={errors.name ? 'border-destructive' : ''}
                  {...field}
                />
              )}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className={errors.email ? 'border-destructive' : ''}
                  {...field}
                />
              )}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Username Field */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Controller
              name="username"
              control={control}
              render={({ field }) => (
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a username"
                  className={errors.username ? 'border-destructive' : ''}
                  {...field}
                />
              )}
            />
            {errors.username && (
              <p className="text-sm text-destructive">{errors.username.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  className={errors.password ? 'border-destructive' : ''}
                  {...field}
                />
              )}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Password must contain at least 8 characters, one uppercase letter, one lowercase letter, and one number.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                {error.message || 'Failed to create account. Please try again.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button type="submit" className="w-full modern-button-primary" disabled={isPending}>
            {isPending ? (
              <div className="flex items-center justify-center">
                <LoadingSpinner size="sm" className="mr-2" />
                Creating account...
              </div>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

        {/* Additional Links */}
        <div className="mt-6 text-center text-sm">
          <p className="text-muted-foreground">
            Already have an account?{' '}
            <a href="/login" className="text-primary hover:underline">
              Sign in
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};