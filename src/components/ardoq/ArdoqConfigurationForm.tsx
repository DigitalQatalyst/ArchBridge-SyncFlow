import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useCreateArdoqConfiguration, useUpdateArdoqConfiguration } from '@/hooks/useArdoq';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type {
  ArdoqConfiguration,
  ConfigurationCreateRequest,
  ConfigurationUpdateRequest,
} from '@/types/ardoq';

const createFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  apiToken: z.string().min(1, 'API Token is required'),
  apiHost: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  orgLabel: z.string().optional(),
  setActive: z.boolean().default(false),
});

const updateFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  apiToken: z.string().optional(),
  apiHost: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  orgLabel: z.string().optional(),
  setActive: z.boolean().default(false),
});

type CreateFormValues = z.infer<typeof createFormSchema>;
type UpdateFormValues = z.infer<typeof updateFormSchema>;
type FormValues = CreateFormValues | UpdateFormValues;

interface ArdoqConfigurationFormProps {
  configuration?: ArdoqConfiguration;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ArdoqConfigurationForm({
  configuration,
  onSuccess,
  onCancel,
}: ArdoqConfigurationFormProps) {
  const { toast } = useToast();
  const createMutation = useCreateArdoqConfiguration();
  const updateMutation = useUpdateArdoqConfiguration();

  const isEditing = !!configuration;

  const form = useForm<FormValues>({
    resolver: zodResolver(isEditing ? updateFormSchema : createFormSchema),
    defaultValues: {
      name: configuration?.name || '',
      apiToken: '',
      apiHost: configuration?.apiHost || 'https://app.ardoq.com',
      orgLabel: configuration?.orgLabel || '',
      setActive: false,
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEditing) {
        const updateData: ConfigurationUpdateRequest = {
          name: values.name,
          apiHost: values.apiHost || undefined,
          orgLabel: values.orgLabel || undefined,
          isActive: values.setActive,
        };

        // Only include apiToken if it's been changed (not empty)
        if (values.apiToken) {
          updateData.apiToken = values.apiToken;
        }

        const result = await updateMutation.mutateAsync({
          id: configuration.id,
          config: updateData,
        });

        toast({
          title: 'Configuration Updated',
          description: 'Configuration has been updated successfully.',
        });

        onSuccess?.();
      } else {
        const createData: ConfigurationCreateRequest = {
          name: values.name,
          apiToken: values.apiToken,
          apiHost: values.apiHost || undefined,
          orgLabel: values.orgLabel || undefined,
          setActive: values.setActive,
        };

        const result = await createMutation.mutateAsync(createData);

        if (result.configuration.testPassed) {
          toast({
            title: 'Configuration Created',
            description: 'Configuration created and connection test passed.',
          });
        } else {
          toast({
            title: 'Configuration Created',
            description: 'Configuration created but connection test failed. Please test it manually.',
            variant: 'destructive',
          });
        }

        onSuccess?.();
      }
    } catch (error) {
      toast({
        title: isEditing ? 'Update Failed' : 'Creation Failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Configuration Name *</FormLabel>
              <FormControl>
                <Input placeholder="My Ardoq Configuration" {...field} />
              </FormControl>
              <FormDescription>
                A friendly name to identify this configuration
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="apiToken"
          render={({ field }) => (
            <FormItem>
              <FormLabel>API Token *</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Enter your Ardoq API token"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {isEditing
                  ? 'Leave empty to keep the existing token, or enter a new one'
                  : 'Your Ardoq API token from Settings → API Tokens'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="apiHost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>API Host</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://app.ardoq.com"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Defaults to https://app.ardoq.com. Use custom domain if applicable.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="orgLabel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organization Label</FormLabel>
              <FormControl>
                <Input placeholder="your-org-label" {...field} />
              </FormControl>
              <FormDescription>
                Your organization label (optional)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="setActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Set as Active Configuration</FormLabel>
                <FormDescription>
                  {isEditing
                    ? 'Activate this configuration (only if test passed)'
                    : 'Set this configuration as active after creation (only if test passes)'}
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Update Configuration' : 'Create Configuration'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

