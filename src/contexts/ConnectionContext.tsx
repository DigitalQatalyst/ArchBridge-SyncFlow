import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SourceCredentials {
  apiToken?: string;
  workspaceUrl?: string;
  [key: string]: any;
}

interface TargetCredentials {
  organizationUrl?: string;
  projectName?: string;
  personalAccessToken?: string;
  [key: string]: any;
}

interface ConnectionContextType {
  sourceType: string;
  sourceCredentials: SourceCredentials;
  sourceConnected: boolean;
  sourceConfigId?: string; // Ardoq configuration ID
  targetType: string;
  targetCredentials: TargetCredentials;
  targetConnected: boolean;
  setSourceType: (type: string) => void;
  setSourceCredentials: (credentials: SourceCredentials) => void;
  setSourceConnected: (connected: boolean) => void;
  setSourceConfigId: (configId: string | undefined) => void;
  setTargetType: (type: string) => void;
  setTargetCredentials: (credentials: TargetCredentials) => void;
  setTargetConnected: (connected: boolean) => void;
  resetConnection: () => void;
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);

export const ConnectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sourceType, setSourceType] = useState<string>('');
  const [sourceCredentials, setSourceCredentials] = useState<SourceCredentials>({});
  const [sourceConnected, setSourceConnected] = useState<boolean>(false);
  const [sourceConfigId, setSourceConfigId] = useState<string | undefined>(undefined);
  const [targetType, setTargetType] = useState<string>('');
  const [targetCredentials, setTargetCredentials] = useState<TargetCredentials>({});
  const [targetConnected, setTargetConnected] = useState<boolean>(false);

  const resetConnection = () => {
    setSourceType('');
    setSourceCredentials({});
    setSourceConnected(false);
    setSourceConfigId(undefined);
    setTargetType('');
    setTargetCredentials({});
    setTargetConnected(false);
  };

  return (
    <ConnectionContext.Provider
      value={{
        sourceType,
        sourceCredentials,
        sourceConnected,
        sourceConfigId,
        targetType,
        targetCredentials,
        targetConnected,
        setSourceType,
        setSourceCredentials,
        setSourceConnected,
        setSourceConfigId,
        setTargetType,
        setTargetCredentials,
        setTargetConnected,
        resetConnection,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
};

export const useConnection = () => {
  const context = useContext(ConnectionContext);
  if (context === undefined) {
    throw new Error('useConnection must be used within a ConnectionProvider');
  }
  return context;
};
