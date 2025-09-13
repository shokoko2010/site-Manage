'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createContentSchema, type CreateContentFormData } from '@/lib/validations/schemas';
import { useCreateContent, useSites } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface ContentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: Partial<CreateContentFormData>;
  siteId?: string;
}

export const ContentForm: React.FC<ContentFormProps> = ({ 
  onSuccess, 
  onCancel, 
  initialData, 
  siteId 
}) => {
  const { data: sites } = useSites();
  const { mutate: createContent, isPending } = useCreateContent();

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CreateContentFormData>({
    resolver: zodResolver(createContentSchema),
    defaultValues: {
      title: initialData?.title || '',
      body: initialData?.body || '',
      type: initialData?.type || 'ARTICLE',
      siteId: siteId || initialData?.siteId || '',
      metaDescription: initialData?.metaDescription || '',
      language: initialData?.language || 'ENGLISH',
    },
  });

  const onSubmit = (data: CreateContentFormData) => {
    createContent(data, {
      onSuccess: () => {
        if (onSuccess) {
          onSuccess();
        }
      },
    });
  };

  return (
    <Card className="modern-card w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="text-xl font-bold">
          {initialData ? 'Edit Content' : 'Create New Content'}
        </CardTitle>
        <CardDescription>
          {initialData ? 'Update your content' : 'Create engaging content for your audience'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Content Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Content Type</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className={errors.type ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select content type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ARTICLE">Article</SelectItem>
                      <SelectItem value="PRODUCT">Product</SelectItem>
                      <SelectItem value="CAMPAIGN">Campaign</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.type && (
                <p className="text-sm text-destructive">{errors.type.message}</p>
              )}
            </div>

            {/* Language */}
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Controller
                name="language"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ENGLISH">English</SelectItem>
                      <SelectItem value="ARABIC">Arabic</SelectItem>
                      <SelectItem value="FRENCH">French</SelectItem>
                      <SelectItem value="SPANISH">Spanish</SelectItem>
                      <SelectItem value="GERMAN">German</SelectItem>
                      <SelectItem value="JAPANESE">Japanese</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Site Selection */}
          <div className="space-y-2">
            <Label htmlFor="siteId">Site (Optional)</Label>
            <Controller
              name="siteId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a site" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No specific site</SelectItem>
                    {sites?.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <Input
                  id="title"
                  type="text"
                  placeholder="Enter content title"
                  className={errors.title ? 'border-destructive' : ''}
                  {...field}
                />
              )}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Meta Description */}
          <div className="space-y-2">
            <Label htmlFor="metaDescription">Meta Description</Label>
            <Controller
              name="metaDescription"
              control={control}
              render={({ field }) => (
                <Textarea
                  id="metaDescription"
                  placeholder="Brief description for SEO (optional)"
                  className={errors.metaDescription ? 'border-destructive' : ''}
                  rows={3}
                  {...field}
                />
              )}
            />
            {errors.metaDescription && (
              <p className="text-sm text-destructive">{errors.metaDescription.message}</p>
            )}
          </div>

          {/* Content Body */}
          <div className="space-y-2">
            <Label htmlFor="body">Content</Label>
            <Controller
              name="body"
              control={control}
              render={({ field }) => (
                <Textarea
                  id="body"
                  placeholder="Write your content here..."
                  className={errors.body ? 'border-destructive' : ''}
                  rows={10}
                  {...field}
                />
              )}
            />
            {errors.body && (
              <p className="text-sm text-destructive">{errors.body.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {field.value?.length || 0} / 50,000 characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            )}
            <Button type="submit" className="modern-button-primary flex-1" disabled={isPending}>
              {isPending ? (
                <div className="flex items-center justify-center">
                  <LoadingSpinner size="sm" className="mr-2" />
                  {initialData ? 'Updating...' : 'Creating...'}
                </div>
              ) : (
                (initialData ? 'Update Content' : 'Create Content')
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};