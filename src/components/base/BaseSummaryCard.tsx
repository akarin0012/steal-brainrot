import { formatNumber } from '../../utils/bigNumber.ts';
import type { NPCBaseDef, NPCState } from '../../types/game.ts';

interface BaseSummaryCardProps {
  baseDef: NPCBaseDef;
  npc: NPCState | null;
  occupiedSlots: number;
  totalSlots: number;
  showNpcDetails?: boolean;
  className?: string;
}

export default function BaseSummaryCard({
  baseDef,
  npc,
  occupiedSlots,
  totalSlots,
  showNpcDetails = true,
  className = 'bg-gray-800 rounded-lg p-4',
}: BaseSummaryCardProps) {
  return (
    <div className={`${className} space-y-2`}>
      <div className="text-white">Difficulty: <span className="font-bold capitalize">{baseDef.difficulty}</span></div>
      <div className="text-gray-400 text-sm">Rarity Range: {baseDef.preferMinRarity} ~ {baseDef.preferMaxRarity}</div>
      <div className="text-gray-400 text-sm">Move Speed: {baseDef.moveSpeed} px/s</div>
      <div className="text-gray-400 text-sm">Steal Chance: {(baseDef.stealChance * 100).toFixed(1)}%</div>
      {showNpcDetails && npc && (
        <>
          <div className="text-gray-400 text-sm">NPC Currency: ${formatNumber(Math.floor(npc.currency))}</div>
          <div className="text-gray-400 text-sm">NPC Income: ${formatNumber(Math.floor(npc.incomePerSec))}/s</div>
          <div className="text-gray-400 text-sm">Slots: {occupiedSlots}/{totalSlots}</div>
          <div className="text-gray-400 text-sm">Status: <span className="capitalize">{npc.state.replaceAll('_', ' ')}</span></div>
        </>
      )}
    </div>
  );
}
