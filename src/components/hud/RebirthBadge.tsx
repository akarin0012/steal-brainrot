import { useGameStore } from '../../stores/gameStore.ts';

export default function RebirthBadge() {
  const level = useGameStore(s => s.rebirthLevel);
  const multiplier = useGameStore(s => s.rebirthMultiplier);

  return (
    <div className="absolute top-3 right-3 z-40 bg-black/70 rounded-lg px-4 py-2 text-white">
      <div className="text-sm font-bold text-purple-400">R{level}</div>
      <div className="text-xs text-gray-400">{multiplier}x</div>
    </div>
  );
}
