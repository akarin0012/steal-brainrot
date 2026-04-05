import type { BrainrotDef, Mutation } from '../../types/game.ts';

export interface SlotInfo {
  def: BrainrotDef;
  mutation?: Mutation;
}
