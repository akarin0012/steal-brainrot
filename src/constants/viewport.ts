import { MAP_W, MAP_H } from '../engine/renderer.ts';
import { TILE_SIZE } from '../utils/collision.ts';

/** Logical game size in CSS pixels (matches canvas). */
export const GAME_W = MAP_W * TILE_SIZE;
export const GAME_H = MAP_H * TILE_SIZE;
