import type { HierarchyItem } from '@/contexts/SyncContext';
import type { EpicSyncItem, FeatureSyncItem, UserStorySyncItem, SyncWorkItemsRequest } from '@/types/azure-devops';

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

      const userStoryItems: UserStorySyncItem[] = featureUserStories.map((story) => ({
        _id: story.id,
        name: story.name,
        type: 'User Story',
        description: story.description,
      }));

      return {
        _id: feature.id,
        name: feature.name,
        type: 'Feature',
        description: feature.description,
        children: userStoryItems.length > 0 ? userStoryItems : undefined,
      };
    });

    return {
      _id: epic.id,
      name: epic.name,
      type: 'Epic',
      description: epic.description,
      children: featureItems.length > 0 ? featureItems : undefined,
    };
  });

  return {
    epics: epicItems,
  };
}

