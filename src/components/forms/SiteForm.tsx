'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createSiteSchema, type CreateSiteFormData } from '@/lib/validations/schemas';
import { useCreateSite, useTestConnection } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Switch } from '@/components/ui/switch';

interface SiteFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: Partial<CreateSiteFormData>;
}

export const SiteForm: React.FC<SiteFormProps> = ({ onSuccess, onCancel, initialData }) => {
  const { mutate: createSite, isPending: isCreating } = useCreateSite();
  const { mutate: testConnection, isPending: isTesting } = useTestConnection();
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CreateSiteFormData>({
    resolver: zodResolver(createSiteSchema),
    defaultValues: {
      url: initialData?.url || '',
      name: initialData?.name || '',
      username: initialData?.username || '',
      appPassword: initialData?.appPassword || '',
      isVirtual: initialData?.isVirtual || false,
    },
  });

  const isVirtual = watch('isVirtual');

  const onSubmit = (data: CreateSiteFormData) => {
    createSite(data, {
      onSuccess: () => {
        if (onSuccess) {
          onSuccess();
        }
      },
    });
  };

  const handleTestConnection = () => {
    const formData = watch();
    testConnection(formData, {
      onSuccess: (result) => {
        if (result.success) {
          setConnectionStatus('success');
        } else {
          setConnectionStatus('error');
        }
      },
      onError: () => {
        setConnectionStatus('error');
      },
    });
  };

  return (
    <Card className="modern-card w-full max-w-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold">
          {initialData ? 'Edit Site' : 'Add New Site'}
        </CardTitle>
        <CardDescription>
          Connect your WordPress site to start managing content
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Site Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Site Name</Label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input
                  id="name"
                  type="text"
                  placeholder="My Awesome Site"
                  className={errors.name ? 'border-destructive' : ''}
                  {...field}
                />
              )}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Site URL */}
          <div className="space-y-2">
            <Label htmlFor="url">Site URL</Label>
            <Controller
              name="url"
              control={control}
              render={({ field }) => (
                <Input
                  id="url"
                  type="url"
                  placeholder="https://yoursite.com"
                  className={errors.url ? 'border-destructive' : ''}
                  {...field}
                />
              )}
            />
            {errors.url && (
              <p className="text-sm text-destructive">{errors.url.message}</p>
            )}
          </div>

          {/* Virtual Site Toggle */}
          <div className="flex items-center space-x-2">
            <Controller
              name="isVirtual"
              control={control}
              render={({ field }) => (
                <Switch
                  id="isVirtual"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="isVirtual">Virtual Site (for testing)</Label>
          </div>

          {!isVirtual && (
            <>
              {/* WordPress Username */}
              <div className="space-y-2">
                <Label htmlFor="username">WordPress Username</Label>
                <Controller
                  name="username"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="username"
                      type="text"
                      placeholder="admin"
                      className={errors.username ? 'border-destructive' : ''}
                      {...field}
                    />
                  )}
                />
                {errors.username && (
                  <p className="text-sm text-destructive">{errors.username.message}</p>
                )}
              </div>

              {/* Application Password */}
              <div className="space-y-2">
                <Label htmlFor="appPassword">Application Password</Label>
                <Controller
                  name="appPassword"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="appPassword"
                      type="password"
                      placeholder="Your application password"
                      className={errors.appPassword ? 'border-destructive' : ''}
                      {...field}
                    />
                  )}
                />
                {errors.appPassword && (
                  <p className="text-sm text-destructive">{errors.appPassword.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Generate an application password in your WordPress dashboard under Users → Profile → Application Passwords
                </p>
              </div>

              {/* Test Connection Button */}
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                >
                  {isTesting ? (
                    <div className="flex items-center justify-center">
                      <LoadingSpinner size="sm" className="mr-2" />
                      Testing connection...
                    </div>
                  ) : (
                    'Test Connection'
                  )}
                </Button>

                {/* Connection Status */}
                {connectionStatus === 'success' && (
                  <Alert className="modern-alert-success">
                    <AlertDescription>
                      Connection successful! Your WordPress site is ready to connect.
                    </AlertDescription>
                  </Alert>
                )}
                {connectionStatus === 'error' && (
                  <Alert className="modern-alert-destructive">
                    <AlertDescription>
                      Connection failed. Please check your credentials and try again.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </>
          )}

          {/* Error Alert */}
          {isCreating && (
            <Alert>
              <AlertDescription>
                Creating your site and establishing connection...
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            )}
            <Button type="submit" className="modern-button-primary flex-1" disabled={isCreating}>
              {isCreating ? (
                <div className="flex items-center justify-center">
                  <LoadingSpinner size="sm" className="mr-2" />
                  Creating...
                </div>
              ) : (
                (initialData ? 'Update Site' : 'Add Site')
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};