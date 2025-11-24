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
import { useCreateAzureDevOpsConfiguration, useUpdateAzureDevOpsConfiguration } from '@/hooks/useAzureDevOps';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type {
  AzureDevOpsConfiguration,
  ConfigurationCreateRequest,
  ConfigurationUpdateRequest,
} from '@/types/azure-devops';

const createFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  organization: z.string().min(1, 'Organization is required'),
  patToken: z.string().min(1, 'PAT Token is required'),
  setActive: z.boolean().default(false),
});

const updateFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  organization: z.string().min(1, 'Organization is required'),
  patToken: z.string().optional(),
  setActive: z.boolean().default(false),
});

type CreateFormValues = z.infer<typeof createFormSchema>;
type UpdateFormValues = z.infer<typeof updateFormSchema>;
type FormValues = CreateFormValues | UpdateFormValues;

interface AzureDevOpsConfigurationFormProps {
  configuration?: AzureDevOpsConfiguration;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AzureDevOpsConfigurationForm({
  configuration,
  onSuccess,
  onCancel,
}: AzureDevOpsConfigurationFormProps) {
  const { toast } = useToast();
  const createMutation = useCreateAzureDevOpsConfiguration();
  const updateMutation = useUpdateAzureDevOpsConfiguration();

  const isEditing = !!configuration;

  const form = useForm<FormValues>({
    resolver: zodResolver(isEditing ? updateFormSchema : createFormSchema),
    defaultValues: {
      name: configuration?.name || '',
      organization: configuration?.organization || '',
      patToken: '',
      setActive: false,
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEditing) {
        const updateData: ConfigurationUpdateRequest = {
          name: values.name,
          organization: values.organization,
          isActive: values.setActive,
        };

        // Only include patToken if it's been changed (not empty)
        if (values.patToken) {
          updateData.patToken = values.patToken;
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
          organization: values.organization,
          patToken: values.patToken,
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
                <Input placeholder="My Azure DevOps Configuration" {...field} />
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
          name="organization"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organization *</FormLabel>
              <FormControl>
                <Input placeholder="mycompany" {...field} />
              </FormControl>
              <FormDescription>
                Your Azure DevOps organization name (found in your Azure DevOps URL)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="patToken"
          render={({ field }) => (
            <FormItem>
              <FormLabel>PAT Token *</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Enter your Personal Access Token"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {isEditing
                  ? 'Leave empty to keep the existing token, or enter a new one'
                  : 'Your Azure DevOps Personal Access Token from User Settings → Personal access tokens'}
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

