import type { TileDef } from '../types/game.ts';

const TILE_SIZE = 32;

function pixelToTile(px: number): number {
  return Math.floor(px / TILE_SIZE);
}

function canWalk(
  tileMap: number[][],
  tileDefs: Record<number, TileDef>,
  tileX: number,
  tileY: number,
): boolean {
  if (tileY < 0 || tileY >= tileMap.length) return false;
  if (tileX < 0 || tileX >= tileMap[0].length) return false;
  const tileId = tileMap[tileY][tileX];
  const def = tileDefs[tileId];
  return def ? def.walkable : false;
}

export function isWalkableRect(
  tileMap: number[][],
  tileDefs: Record<number, TileDef>,
  x: number,
  y: number,
  w: number,
  h: number,
): boolean {
  const left = pixelToTile(x);
  const right = pixelToTile(x + w - 1);
  const top = pixelToTile(y);
  const bottom = pixelToTile(y + h - 1);

  for (let ty = top; ty <= bottom; ty++) {
    for (let tx = left; tx <= right; tx++) {
      if (!canWalk(tileMap, tileDefs, tx, ty)) return false;
    }
  }
  return true;
}

export { TILE_SIZE };
