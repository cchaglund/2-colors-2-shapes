import { useContext } from 'react';
import { FollowsContext, type FollowsContextValue } from '../contexts/FollowsContext';

export function useFollows(): FollowsContextValue {
  const context = useContext(FollowsContext);
  if (!context) {
    throw new Error('useFollows must be used within a FollowsProvider');
  }
  return context;
}
