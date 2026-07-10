import { createContext, ReactNode, useContext } from 'react';

import { useWalkingPadBle } from '../hooks/useWalkingPadBle';

type WalkingPadBleContextValue = ReturnType<typeof useWalkingPadBle>;

const WalkingPadBleContext = createContext<WalkingPadBleContextValue | null>(null);

type WalkingPadBleProviderProps = {
  children: ReactNode;
  userId: string | null;
};

export function WalkingPadBleProvider({ children, userId }: WalkingPadBleProviderProps) {
  const value = useWalkingPadBle(userId);

  return <WalkingPadBleContext.Provider value={value}>{children}</WalkingPadBleContext.Provider>;
}

export function useWalkingPadBleContext() {
  const context = useContext(WalkingPadBleContext);

  if (!context) {
    throw new Error('useWalkingPadBleContext must be used within a WalkingPadBleProvider');
  }

  return context;
}
