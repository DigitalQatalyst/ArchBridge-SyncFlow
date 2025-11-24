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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCreateAzureDevOpsProject, useProcessTemplates } from '@/hooks/useAzureDevOps';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle } from 'lucide-react';
import type { CreateProjectRequest, ProcessTemplate } from '@/types/azure-devops';
import { useConnection } from '@/contexts/ConnectionContext';
import { useEffect, useMemo } from 'react';

// Templates that support User Stories (based on Azure DevOps documentation)
const TEMPLATES_WITH_USER_STORIES = ['Agile'];

const projectFormSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  visibility: z.enum(['private', 'public']).optional().default('private'),
  processTemplateId: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

interface CreateProjectFormProps {
  onSuccess?: (projectName: string) => void;
  onCancel?: () => void;
}

export function CreateProjectForm({ onSuccess, onCancel }: CreateProjectFormProps) {
  const { toast } = useToast();
  const { targetConfigId, setProjectName } = useConnection();
  const createMutation = useCreateAzureDevOpsProject();
  const { data: templates, isLoading: loadingTemplates, error: templatesError } = useProcessTemplates(targetConfigId);

  // Find Agile template as default
  const agileTemplate = useMemo(() => {
    return templates?.find((t) => t.name.toLowerCase() === 'agile');
  }, [templates]);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: '',
      description: '',
      visibility: 'private',
      processTemplateId: undefined, // Will be set to Agile when templates load
    },
  });

  // Set default to Agile when templates are loaded
  useEffect(() => {
    if (agileTemplate && !form.getValues('processTemplateId')) {
      form.setValue('processTemplateId', agileTemplate.typeId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agileTemplate]);

  const selectedTemplateId = form.watch('processTemplateId');
  const selectedTemplate = useMemo(() => {
    return templates?.find((t) => t.typeId === selectedTemplateId);
  }, [templates, selectedTemplateId]);

  // Show warning if template is not Agile (Agile is the only one that supports User Stories)
  const showUserStoryWarning = useMemo(() => {
    if (!selectedTemplate) return false;
    return !TEMPLATES_WITH_USER_STORIES.includes(selectedTemplate.name);
  }, [selectedTemplate]);

  const onSubmit = async (values: ProjectFormValues) => {
    try {
      const template = templates?.find((t) => t.typeId === values.processTemplateId);
      
      const projectData: CreateProjectRequest = {
        name: values.name,
        description: values.description || undefined,
        visibility: values.visibility,
        // Only include capabilities if a template is selected and it's not Agile
        // If Agile or no template selected, omit capabilities to use server defaults
        ...(template && template.name.toLowerCase() !== 'agile' && {
          capabilities: {
            processTemplate: {
              templateTypeId: template.typeId,
            },
            versioncontrol: {
              sourceControlType: 'Git',
            },
          },
        }),
      };

      const result = await createMutation.mutateAsync({
        project: projectData,
        configId: targetConfigId,
      });

      setProjectName(values.name);
      
      toast({
        title: 'Project Creation Queued',
        description: `Project "${values.name}" creation has been queued successfully.`,
      });

      onSuccess?.(values.name);
    } catch (error) {
      toast({
        title: 'Project Creation Failed',
        description: error instanceof Error ? error.message : 'Failed to create project',
        variant: 'destructive',
      });
    }
  };

  const isLoading = createMutation.isPending || loadingTemplates;

  // Show error if templates failed to load
  if (templatesError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load process templates: {templatesError instanceof Error ? templatesError.message : 'Unknown error'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Name *</FormLabel>
              <FormControl>
                <Input placeholder="My New Project" {...field} />
              </FormControl>
              <FormDescription>
                The name of the project. This must be unique in your Azure DevOps organization.
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
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Project description (optional)"
                  {...field}
                  rows={3}
                />
              </FormControl>
              <FormDescription>
                A brief description of the project.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="visibility"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Visibility</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Choose whether the project is private or public.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="processTemplateId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Process Template</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={loadingTemplates || !templates || templates.length === 0}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingTemplates ? 'Loading templates...' : 'Select process template'} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {templates?.map((template) => (
                    <SelectItem key={template.typeId} value={template.typeId}>
                      {template.name}
                      {template.name.toLowerCase() === 'agile' && ' (Default)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Choose the process template for your project. Defaults to Agile if not specified.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {showUserStoryWarning && selectedTemplate && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> The {selectedTemplate.name} process template does not support User Stories. 
              When syncing work items, User Stories will not be created. Only Epics and Features will be synced.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Project
          </Button>
        </div>
      </form>
    </Form>
  );
}

