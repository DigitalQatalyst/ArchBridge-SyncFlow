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
import { useCreateAzureDevOpsProject } from '@/hooks/useAzureDevOps';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { CreateProjectRequest } from '@/types/azure-devops';
import { useConnection } from '@/contexts/ConnectionContext';

const projectFormSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  visibility: z.enum(['private', 'public']).optional().default('private'),
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

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: '',
      description: '',
      visibility: 'private',
    },
  });

  const onSubmit = async (values: ProjectFormValues) => {
    try {
      const projectData: CreateProjectRequest = {
        name: values.name,
        description: values.description || undefined,
        visibility: values.visibility,
        capabilities: {
          processTemplate: {
            templateTypeId: '6b724908-ef14-45cf-84f8-768b5384da45', // Basic process template
          },
          versioncontrol: {
            sourceControlType: 'Git',
          },
        },
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

  const isLoading = createMutation.isPending;

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

