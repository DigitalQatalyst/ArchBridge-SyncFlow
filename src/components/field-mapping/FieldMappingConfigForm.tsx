import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useCreateFieldMappingConfig, useUpdateFieldMappingConfig, useWorkItemTypes } from '@/hooks/useFieldMapping';
import type { FieldMappingConfig, FieldMapping } from '@/types/field-mapping';
import { FieldMappingEditor } from './FieldMappingEditor';
import { Loader2 } from 'lucide-react';

const configFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  isDefault: z.boolean().optional(),
});

type ConfigFormValues = z.infer<typeof configFormSchema>;

interface FieldMappingConfigFormProps {
  projectId: string;
  projectName?: string;
  config?: FieldMappingConfig;
  azureDevOpsConfigId?: string; // Azure DevOps configuration ID for API calls
  onSuccess: () => void;
  onCancel: () => void;
}

export function FieldMappingConfigForm({
  projectId,
  projectName,
  config,
  azureDevOpsConfigId,
  onSuccess,
  onCancel,
}: FieldMappingConfigFormProps) {
  const [mappings, setMappings] = useState<FieldMapping[]>(config?.mappings || []);
  const createMutation = useCreateFieldMappingConfig();
  const updateMutation = useUpdateFieldMappingConfig();
  const { data: workItemTypes, isLoading: loadingTypes } = useWorkItemTypes(projectId, azureDevOpsConfigId);

  const form = useForm<ConfigFormValues>({
    resolver: zodResolver(configFormSchema),
    defaultValues: {
      name: config?.name || '',
      description: config?.description || '',
      isDefault: config?.isDefault || false,
    },
  });

  const onSubmit = async (values: ConfigFormValues) => {
    const configData: Omit<FieldMappingConfig, 'id' | 'createdAt' | 'updatedAt'> = {
      name: values.name,
      description: values.description,
      projectId,
      projectName,
      mappings,
      isDefault: values.isDefault || false,
    };

    try {
      if (config) {
        await updateMutation.mutateAsync({
          configId: config.id,
          config: configData,
        });
      } else {
        await createMutation.mutateAsync(configData);
      }
      onSuccess();
    } catch (error) {
      // Error handling is done in the mutation hooks
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{config ? 'Edit Field Mapping Configuration' : 'Create Field Mapping Configuration'}</CardTitle>
        <CardDescription>
          {projectName && `Project: ${projectName}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Configuration Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Default Mapping" {...field} />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for this field mapping configuration
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe this field mapping configuration..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div>
                <Label>Field Mappings</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Map Ardoq fields to Azure DevOps work item fields
                </p>
              </div>

              {loadingTypes ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading work item types...</span>
                </div>
              ) : (
                <FieldMappingEditor
                  mappings={mappings}
                  onChange={setMappings}
                  workItemTypes={workItemTypes || []}
                />
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {config ? 'Update Configuration' : 'Create Configuration'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

