import { useState, useEffect } from 'react';
import { GAME_W, GAME_H } from '../constants/viewport.ts';

export function useViewportScale(): number {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function update() {
      const s = Math.min(window.innerWidth / GAME_W, window.innerHeight / GAME_H);
      setScale(s);
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return scale;
}
