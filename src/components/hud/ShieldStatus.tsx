import { useGameStore } from '../../stores/gameStore.ts';

export default function ShieldStatus() {
  const shield = useGameStore(s => s.shield);

  if (!shield.active) return null;

  return (
    <div className="absolute top-10 left-1/2 -translate-x-1/2 z-40 bg-black/70 rounded-lg px-4 py-2 text-white text-sm flex items-center gap-3">
      <span className="text-cyan-400">Shield: {Math.ceil(shield.remainingSec)}s</span>
    </div>
  );
}
