import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import type { FieldMapping, WorkItemTypeInfo } from '@/types/field-mapping';

interface FieldMappingEditorProps {
  mappings: FieldMapping[];
  onChange: (mappings: FieldMapping[]) => void;
  workItemTypes: WorkItemTypeInfo[];
}

// Common Ardoq fields that users might want to map
const commonArdoqFields = {
  epic: [
    'description',
    'lastUpdatedBy',
    'lastUpdatedDate',
    'tags',
    'capabilityMapOrder',
    'priority',
  ],
  feature: [
    'description',
    'context',
    'purpose',
    'input',
    'output',
    'approach',
    'lastUpdatedBy',
    'lastUpdatedDate',
    'tags',
    'capabilityMapOrder',
    'priority',
  ],
  user_story: [
    'description',
    'acceptanceCriteria',
    'classification',
    'priority',
    'risk',
    'lastUpdatedBy',
    'lastUpdatedDate',
    'tags',
    'capabilityMapOrder',
  ],
};

// Common Azure DevOps fields
const commonAzureDevOpsFields = [
  { referenceName: 'System.Title', name: 'Title' },
  { referenceName: 'System.Description', name: 'Description' },
  { referenceName: 'System.Tags', name: 'Tags' },
  { referenceName: 'System.ChangedBy', name: 'Changed By' },
  { referenceName: 'System.ChangedDate', name: 'Changed Date' },
  { referenceName: 'Microsoft.VSTS.Common.Priority', name: 'Priority' },
  { referenceName: 'Microsoft.VSTS.Common.AcceptanceCriteria', name: 'Acceptance Criteria' },
  { referenceName: 'Microsoft.VSTS.Common.StackRank', name: 'Stack Rank' },
];

export function FieldMappingEditor({
  mappings,
  onChange,
  workItemTypes,
}: FieldMappingEditorProps) {
  const [activeTab, setActiveTab] = useState<'epic' | 'feature' | 'user_story'>('epic');

  const getMappingsForType = (type: 'epic' | 'feature' | 'user_story') => {
    return mappings.filter((m) => m.workItemType === type);
  };

  const addMapping = (type: 'epic' | 'feature' | 'user_story') => {
    const newMapping: FieldMapping = {
      ardoqField: '',
      azureDevOpsField: '',
      workItemType: type,
    };
    onChange([...mappings, newMapping]);
  };

  const updateMapping = (index: number, updates: Partial<FieldMapping>) => {
    const updated = [...mappings];
    const mappingIndex = mappings.findIndex(
      (m, i) => m.workItemType === activeTab && i === index
    );
    if (mappingIndex !== -1) {
      updated[mappingIndex] = { ...updated[mappingIndex], ...updates };
      onChange(updated);
    }
  };

  const removeMapping = (index: number) => {
    const typeMappings = getMappingsForType(activeTab);
    const mappingToRemove = typeMappings[index];
    onChange(mappings.filter((m) => m !== mappingToRemove));
  };

  const getAvailableFields = (type: 'epic' | 'feature' | 'user_story') => {
    const workItemType = workItemTypes.find(
      (wt) => wt.referenceName.toLowerCase().includes(type.replace('_', ''))
    );
    if (workItemType) {
      return workItemType.fields;
    }
    return commonAzureDevOpsFields;
  };

  const typeMappings = getMappingsForType(activeTab);
  const availableFields = getAvailableFields(activeTab);
  const ardoqFields = commonArdoqFields[activeTab];

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="epic">Epic</TabsTrigger>
          <TabsTrigger value="feature">Feature</TabsTrigger>
          <TabsTrigger value="user_story">User Story</TabsTrigger>
        </TabsList>

        {(['epic', 'feature', 'user_story'] as const).map((type) => (
          <TabsContent key={type} value={type} className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold capitalize">{type.replace('_', ' ')} Field Mappings</h4>
                <p className="text-sm text-muted-foreground">
                  Map Ardoq fields to Azure DevOps {type.replace('_', ' ')} fields
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addMapping(type)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Mapping
              </Button>
            </div>

            {getMappingsForType(type).length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No mappings configured. Click "Add Mapping" to create one.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {getMappingsForType(type).map((mapping, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Ardoq Field</Label>
                          <Select
                            value={mapping.ardoqField}
                            onValueChange={(value) =>
                              updateMapping(
                                getMappingsForType(type).indexOf(mapping),
                                { ardoqField: value }
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Ardoq field" />
                            </SelectTrigger>
                            <SelectContent>
                              {ardoqFields.map((field) => (
                                <SelectItem key={field} value={field}>
                                  {field}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Azure DevOps Field</Label>
                          <Select
                            value={mapping.azureDevOpsField}
                            onValueChange={(value) =>
                              updateMapping(
                                getMappingsForType(type).indexOf(mapping),
                                { azureDevOpsField: value }
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Azure DevOps field" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableFields.map((field) => (
                                <SelectItem key={field.referenceName} value={field.referenceName}>
                                  {field.name} ({field.referenceName})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="mt-4 flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMapping(getMappingsForType(type).indexOf(mapping))}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

