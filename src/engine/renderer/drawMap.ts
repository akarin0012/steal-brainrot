import { TILE_SIZE } from '../../utils/collision.ts';
import { TOWN_MAP, TILE_DEFS } from '../../data/townMap.ts';
import { MAP_W, MAP_H } from './constants.ts';

export function drawMapTiles(ctx: CanvasRenderingContext2D): void {
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const tileId = TOWN_MAP[y][x];
      const def = TILE_DEFS[tileId];
      ctx.fillStyle = def?.color ?? '#000';
      ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

      ctx.strokeStyle = 'rgba(0,0,0,0.08)';
      ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }
}
