import { usePersonalAgent as usePersonalAgentContext } from '@/context/PersonalAgentContext';

export function usePersonalAgent() {
  return usePersonalAgentContext();
}