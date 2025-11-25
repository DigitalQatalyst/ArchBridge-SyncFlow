import type { HierarchyItem } from '@/contexts/SyncContext';
import type { EpicSyncItem, FeatureSyncItem, UserStorySyncItem, SyncWorkItemsRequest } from '@/types/azure-devops';

/**
 * Extracts all fields from Ardoq item, preserving original field names
 */
function extractArdoqFields(item: HierarchyItem): Record<string, any> {
  const fields: Record<string, any> = {
    _id: item.id,
    name: item.name,
    type: item.type === 'epic' ? 'Epic' : item.type === 'feature' ? 'Feature' : 'User Story',
    description: item.description,
  };
  
  // Extract additional fields from rawData
  if (item.rawData) {
    Object.keys(item.rawData).forEach(key => {
      // Skip fields we've already handled
      if (!['id', 'name', 'type', 'description', 'parentId', 'parent', 'children'].includes(key)) {
        fields[key] = item.rawData![key];
      }
    });
  }
  
  // Also include explicitly defined fields if they exist
  if (item.priority !== undefined) fields.priority = item.priority;
  if (item.risk !== undefined) fields.risk = item.risk;
  
  return fields;
}

/**
 * Transforms flat hierarchy data to nested API format
 * Converts flat array with parentId relationships to nested structure: epics → features → user stories
 */
export function transformHierarchyToSyncFormat(
  hierarchyData: HierarchyItem[],
  selectedItemIds: string[]
): SyncWorkItemsRequest {
  // Filter to only selected items
  const selectedItems = hierarchyData.filter((item) => selectedItemIds.includes(item.id));

  // Separate items by type
  const epics = selectedItems.filter((item) => item.type === 'epic');
  const features = selectedItems.filter((item) => item.type === 'feature');
  const userStories = selectedItems.filter((item) => item.type === 'userStory');

  // Build nested structure
  const epicItems: EpicSyncItem[] = epics.map((epic) => {
    // Find features that belong to this epic
    const epicFeatures = features.filter((feature) => feature.parentId === epic.id);

    const featureItems: FeatureSyncItem[] = epicFeatures.map((feature) => {
      // Find user stories that belong to this feature
      const featureUserStories = userStories.filter(
        (story) => story.parentId === feature.id
      );

      const userStoryItems: UserStorySyncItem[] = featureUserStories.map((story) => {
        const storyFields = extractArdoqFields(story);
        return storyFields as UserStorySyncItem;
      });

      const featureFields = extractArdoqFields(feature);
      return {
        ...featureFields,
        type: 'Feature',
        children: userStoryItems.length > 0 ? userStoryItems : undefined,
      } as FeatureSyncItem;
    });

    const epicFields = extractArdoqFields(epic);
    return {
      ...epicFields,
      type: 'Epic',
      children: featureItems.length > 0 ? featureItems : undefined,
    } as EpicSyncItem;
  });

  return {
    epics: epicItems,
  };
}

