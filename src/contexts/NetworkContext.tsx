import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';

// Fallback network detection for when NetInfo is not available
const useFallbackNetworkDetection = () => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(null);
  const [connectionType, setConnectionType] = useState<string | null>(null);

  useEffect(() => {
    // Simple network detection using fetch
    const checkNetwork = async () => {
      try {
        const response = await fetch('https://www.google.com', {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-cache',
        });
        setIsConnected(true);
        setIsInternetReachable(true);
        setConnectionType('unknown');
      } catch (error) {
        setIsConnected(false);
        setIsInternetReachable(false);
        setConnectionType('none');
      }
    };

    // Check network on mount
    checkNetwork();

    // Check network every 30 seconds
    const interval = setInterval(checkNetwork, 30000);

    return () => clearInterval(interval);
  }, []);

  return { isConnected, isInternetReachable, connectionType };
};

// Try to use NetInfo, fallback to custom detection
const useNetworkDetection = () => {
  const [netInfoAvailable, setNetInfoAvailable] = useState<boolean | null>(null);
  const [netInfoState, setNetInfoState] = useState({
    isConnected: true,
    isInternetReachable: null as boolean | null,
    connectionType: null as string | null,
  });

  const fallbackState = useFallbackNetworkDetection();

  useEffect(() => {
    // Try to import NetInfo dynamically
    const loadNetInfo = async () => {
      try {
        const NetInfo = await import('@react-native-community/netinfo');
        
        const unsubscribe = NetInfo.default.addEventListener(state => {
          console.log('🌐 Network state changed:', {
            isConnected: state.isConnected,
            isInternetReachable: state.isInternetReachable,
            type: state.type,
            details: state.details
          });

          setNetInfoState({
            isConnected: state.isConnected ?? false,
            isInternetReachable: state.isInternetReachable,
            connectionType: state.type,
          });
        });

        // Get initial network state
        NetInfo.default.fetch().then(state => {
          setNetInfoState({
            isConnected: state.isConnected ?? false,
            isInternetReachable: state.isInternetReachable,
            connectionType: state.type,
          });
        });

        setNetInfoAvailable(true);
        return unsubscribe;
      } catch (error) {
        console.warn('NetInfo not available, using fallback detection:', error);
        setNetInfoAvailable(false);
      }
    };

    loadNetInfo();
  }, []);

  if (netInfoAvailable === true) {
    return netInfoState;
  } else if (netInfoAvailable === false) {
    return fallbackState;
  } else {
    // Still loading, return default state
    return { isConnected: true, isInternetReachable: null, connectionType: null };
  }
};

interface NetworkContextType {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: string | null;
  isOffline: boolean;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};

interface NetworkProviderProps {
  children: ReactNode;
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  const { isConnected, isInternetReachable, connectionType } = useNetworkDetection();

  const isOffline = !isConnected || isInternetReachable === false;

  const value: NetworkContextType = {
    isConnected,
    isInternetReachable,
    connectionType,
    isOffline,
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
};