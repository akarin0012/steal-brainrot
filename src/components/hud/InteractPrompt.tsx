import { useUIStore } from '../../stores/uiStore.ts';

export default function InteractPrompt() {
  const prompt = useUIStore(s => s.interactPrompt);
  const overlay = useUIStore(s => s.overlay);

  if (!prompt || overlay !== 'none') return null;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-black/80 rounded-lg px-5 py-2 text-white text-sm">
      <span className="text-yellow-400 font-bold">[F]</span>{' '}
      <span>{prompt}</span>
    </div>
  );
}
