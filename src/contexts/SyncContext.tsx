import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface HierarchyItem {
  id: string;
  name: string;
  type: 'domain' | 'initiative' | 'epic' | 'feature' | 'userStory';
  parentId?: string;
  priority?: string;
  risk?: string;
  description?: string;
}

interface SyncContextType {
  selectedWorkspaceId: string;
  selectedDomain: string;
  selectedInitiative: string;
  selectedHierarchyItems: string[];
  hierarchyData: HierarchyItem[];
  syncInProgress: boolean;
  syncResults: any | null;
  setSelectedWorkspaceId: (workspaceId: string) => void;
  setSelectedDomain: (domain: string) => void;
  setSelectedInitiative: (initiative: string) => void;
  setSelectedHierarchyItems: (items: string[]) => void;
  toggleHierarchyItem: (itemId: string) => void;
  setHierarchyData: (data: HierarchyItem[]) => void;
  setSyncInProgress: (inProgress: boolean) => void;
  setSyncResults: (results: any) => void;
  resetSync: () => void;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [selectedInitiative, setSelectedInitiative] = useState<string>('');
  const [selectedHierarchyItems, setSelectedHierarchyItems] = useState<string[]>([]);
  const [hierarchyData, setHierarchyData] = useState<HierarchyItem[]>([]);
  const [syncInProgress, setSyncInProgress] = useState<boolean>(false);
  const [syncResults, setSyncResults] = useState<any | null>(null);

  const toggleHierarchyItem = useCallback((itemId: string) => {
    setSelectedHierarchyItems((prev) => {
      const isCurrentlySelected = prev.includes(itemId);
      const item = hierarchyData.find((i) => i.id === itemId);
      
      if (!item) {
        // If item not found, just toggle it
        return isCurrentlySelected ? prev.filter((id) => id !== itemId) : [...prev, itemId];
      }

      if (isCurrentlySelected) {
        // Deselecting: remove the item and all its children
        const itemsToRemove = new Set<string>([itemId]);
        
        // If deselecting an epic, deselect all its features and user stories
        if (item.type === 'epic') {
          const features = hierarchyData.filter((i) => i.type === 'feature' && i.parentId === itemId);
          features.forEach((feature) => {
            itemsToRemove.add(feature.id);
            // Also deselect all user stories under this feature
            const userStories = hierarchyData.filter(
              (i) => i.type === 'userStory' && i.parentId === feature.id
            );
            userStories.forEach((story) => itemsToRemove.add(story.id));
          });
        }
        
        // If deselecting a feature, deselect all its user stories
        if (item.type === 'feature') {
          const userStories = hierarchyData.filter(
            (i) => i.type === 'userStory' && i.parentId === itemId
          );
          userStories.forEach((story) => itemsToRemove.add(story.id));
        }
        
        return prev.filter((id) => !itemsToRemove.has(id));
      } else {
        // Selecting: just add the item
        return [...prev, itemId];
      }
    });
  }, [hierarchyData]);

  const resetSync = () => {
    setSelectedWorkspaceId('');
    setSelectedDomain('');
    setSelectedInitiative('');
    setSelectedHierarchyItems([]);
    setHierarchyData([]);
    setSyncInProgress(false);
    setSyncResults(null);
  };

  return (
    <SyncContext.Provider
      value={{
        selectedWorkspaceId,
        selectedDomain,
        selectedInitiative,
        selectedHierarchyItems,
        hierarchyData,
        syncInProgress,
        syncResults,
        setSelectedWorkspaceId,
        setSelectedDomain,
        setSelectedInitiative,
        setSelectedHierarchyItems,
        toggleHierarchyItem,
        setHierarchyData,
        setSyncInProgress,
        setSyncResults,
        resetSync,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};
