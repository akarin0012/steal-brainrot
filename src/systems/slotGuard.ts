import type { Mutation } from '../types/game.ts';

let _suppressed: { defId: string; mutation?: Mutation } | null = null;

export function suppressSlotReplace(defId: string, mutation?: Mutation) {
  _suppressed = { defId, mutation };
}

export function clearSlotReplaceSuppress() {
  _suppressed = null;
}

export function isSlotReplaceSuppressed(defId: string, mutation?: Mutation): boolean {
  if (!_suppressed) return false;
  return _suppressed.defId === defId && _suppressed.mutation === mutation;
}
