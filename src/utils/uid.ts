import type { OwnedBrainrot, Mutation } from '../types/game.ts';

let counter = 0;

export function generateInstanceId(defId: string): string {
  return `${defId}_${Date.now()}_${(++counter).toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function createOwnedBrainrot(
  defId: string,
  source: OwnedBrainrot['source'] = 'conveyor',
  mutation?: Mutation,
): OwnedBrainrot {
  return {
    defId,
    instanceId: generateInstanceId(defId),
    acquiredAt: Date.now(),
    source,
    mutation,
  };
}
