import { useRef, useEffect } from 'react';
import { useWorldStore } from '../stores/worldStore.ts';
import { useUIStore } from '../stores/uiStore.ts';
import { useGameStore } from '../stores/gameStore.ts';
import { input } from '../engine/input.ts';
import { renderWorld, PLAYER_SIZE, MAP_W, MAP_H, type SlotInfo } from '../engine/renderer.ts';
import { TILE_SIZE, isWalkableRect } from '../utils/collision.ts';
import { TOWN_MAP, TILE_DEFS, HOME_BOUNDS } from '../data/townMap.ts';
import { BRAINROT_MAP } from '../data/brainrots.ts';
import { NPC_BASE_MAP } from '../data/npcBases.ts';
import { findNearbyInteractable, findNearbyCarryingNPC, executeInteract, executeNPCSteal, tryRecoverFromNPC } from '../systems/interact.ts';
import { tickIncome, calcOfflineIncome } from '../systems/income.ts';
import { formatNumber } from '../utils/bigNumber.ts';
import { tickNPCs, tickNPCIncome, isNPCHome } from '../systems/npcAI.ts';
import {
  tickConveyor,
  getConveyorItems,
  findNearestConveyorItem,
  pickUpConveyorItem,
} from '../systems/conveyor.ts';
import type { Direction, OwnedBrainrot, Mutation } from '../types/game.ts';
import { getMutationMultiplier } from '../data/mutations.ts';
import { useGearStore } from '../stores/gearStore.ts';

function createOwnedBrainrot(defId: string, source: OwnedBrainrot['source'] = 'conveyor', mutation?: Mutation): OwnedBrainrot {
  return {
    defId,
    instanceId: `${defId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    acquiredAt: Date.now(),
    source,
    mutation,
  };
}

const CANVAS_W = MAP_W * TILE_SIZE;
const CANVAS_H = MAP_H * TILE_SIZE;
const PLAYER_SPEED = 120;
const BASE_CARRY_SPEED_MULT = 0.65;

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastTimeRef = useRef(performance.now());
  const econTimerRef = useRef(0);
  const offlineChecked = useRef(false);

  useEffect(() => {
    if (!offlineChecked.current) {
      offlineChecked.current = true;
      const lastSave = useGameStore.getState().lastSaveTime;
      if (lastSave > 0) {
        const income = calcOfflineIncome(lastSave);
        if (income > 0) {
          const elapsed = Math.min(Math.floor((Date.now() - lastSave) / 1000), 7200);
          useGameStore.getState().addCurrency(income);
          useUIStore.getState().openOverlay('offline_income', { amount: income, seconds: elapsed });
        }
      }
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;

    function gameLoop(now: number) {
      try {
        const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
        lastTimeRef.current = now;

        const overlay = useUIStore.getState().overlay;

        if (overlay === 'none') {
          tickConveyor(dt);
          tickNPCs(dt);
          updateOverworld(dt);
          useGearStore.getState().tickGears(dt);

          econTimerRef.current += dt;
          if (econTimerRef.current >= 1) {
            econTimerRef.current -= 1;
            tickIncome();
            useGameStore.getState().tickShield(1);
            tickNPCIncome();
            useGameStore.getState().setLastSaveTime(Date.now());
          }
        }

        const world = useWorldStore.getState();
        const interactTarget = findNearbyInteractable();
        const convItems = getConveyorItems();
        const nearConvItem = findNearestConveyorItem(world.playerX, world.playerY);

        const game = useGameStore.getState();
        const slotContents = new Map<string, SlotInfo | null>();

        game.buildingSlots.forEach((instId, i) => {
          const slotId = `slot_${i}`;
          if (!instId) { slotContents.set(slotId, null); return; }
          const ownedItem = game.ownedBrainrots.find(b => b.instanceId === instId);
          if (!ownedItem) { slotContents.set(slotId, null); return; }
          const def = BRAINROT_MAP.get(ownedItem.defId);
          slotContents.set(slotId, def ? { def, mutation: ownedItem.mutation } : null);
        });

        for (const npc of world.npcs) {
          const base = NPC_BASE_MAP.get(npc.baseId);
          if (!base) continue;
          npc.buildingSlots.forEach((defId, i) => {
            const slotId = `${npc.baseId}_slot_${i}`;
            const def = defId ? BRAINROT_MAP.get(defId) : null;
            slotContents.set(slotId, def ? { def } : null);
          });
        }

        const shieldActive = game.shield.active;
        const carrying = world.carryingBrainrot;
        const carryingDef = carrying ? BRAINROT_MAP.get(carrying.defId) ?? null : null;

        const playerSlotCount = game.getPlayerSlotCount();

        renderWorld(
          ctx!, world.playerX, world.playerY, world.playerDir,
          interactTarget, convItems, nearConvItem,
          slotContents, shieldActive, carryingDef, world.npcs,
          playerSlotCount, carrying?.mutation,
        );
      } catch (err) {
        console.error('Game loop error:', err);
      }

      input.clearFrame();
      animId = requestAnimationFrame(gameLoop);
    }

    animId = requestAnimationFrame(gameLoop);

    const unsubF = input.onKey('KeyF', () => {
      const overlay = useUIStore.getState().overlay;
      if (overlay !== 'none') return;

      const world = useWorldStore.getState();

      if (!world.carryingBrainrot) {
        const nearNPC = findNearbyCarryingNPC();
        if (nearNPC) {
          if (tryRecoverFromNPC(nearNPC.npcId)) {
            return;
          }
          const defId = executeNPCSteal(nearNPC.npcId);
          if (defId) {
            useWorldStore.getState().setCarrying({ defId });
          }
          return;
        }

        const convItem = findNearestConveyorItem(world.playerX, world.playerY);
        if (convItem) {
          const result = pickUpConveyorItem(convItem.id);
          if (result) {
            useWorldStore.getState().setCarrying({ defId: result.def.id, mutation: result.mutation });
          }
          return;
        }
      }

      const target = findNearbyInteractable();
      if (target) executeInteract(target);
    });

    const unsubEsc = input.onKey('Escape', () => {
      const overlay = useUIStore.getState().overlay;
      if (overlay !== 'none') {
        useUIStore.getState().closeOverlay();
      }
    });

    function openMenuOverlay(type: 'upgrade' | 'rebirth' | 'collection') {
      const overlay = useUIStore.getState().overlay;
      if (overlay === type) {
        useUIStore.getState().closeOverlay();
      } else if (overlay === 'none') {
        useUIStore.getState().openOverlay(type);
      }
    }

    const unsubU = input.onKey('KeyU', () => openMenuOverlay('upgrade'));
    const unsubR = input.onKey('KeyR', () => openMenuOverlay('rebirth'));
    const unsubC = input.onKey('KeyC', () => openMenuOverlay('collection'));

    const gearUnsubs = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6'].map((key, i) =>
      input.onKey(key, () => {
        if (useUIStore.getState().overlay !== 'none') return;
        const gears = useGearStore.getState().getUnlockedGears();
        if (i < gears.length) {
          useGearStore.getState().useGear(gears[i].id);
        }
      })
    );

    return () => {
      cancelAnimationFrame(animId);
      unsubF();
      unsubEsc();
      unsubU();
      unsubR();
      unsubC();
      gearUnsubs.forEach(u => u());
    };
  }, []);

  function updateOverworld(dt: number) {
    const { dx, dy } = input.getMovement();
    if (dx === 0 && dy === 0) {
      checkHomeDelivery();
      updateInteractPrompt();
      return;
    }

    const world = useWorldStore.getState();
    let dir: Direction = world.playerDir;
    if (dy < 0) dir = 'up';
    else if (dy > 0) dir = 'down';
    else if (dx < 0) dir = 'left';
    else if (dx > 0) dir = 'right';

    const carrySpeedBonus = useGameStore.getState().getCarrySpeedBonus();
    const gearSpeedBoost = useGearStore.getState().getEffectValue('speed_boost');
    const carryMult = BASE_CARRY_SPEED_MULT + carrySpeedBonus;
    const baseSpeed = world.carryingBrainrot ? PLAYER_SPEED * carryMult : PLAYER_SPEED;
    const speed = baseSpeed * (1 + gearSpeedBoost) * dt;
    const len = Math.sqrt(dx * dx + dy * dy);
    const ndx = (dx / len) * speed;
    const ndy = (dy / len) * speed;

    let newX = world.playerX + ndx;
    let newY = world.playerY + ndy;

    if (!isWalkableRect(TOWN_MAP, TILE_DEFS, newX, newY, PLAYER_SIZE, PLAYER_SIZE)) {
      if (isWalkableRect(TOWN_MAP, TILE_DEFS, newX, world.playerY, PLAYER_SIZE, PLAYER_SIZE)) {
        newY = world.playerY;
      } else if (isWalkableRect(TOWN_MAP, TILE_DEFS, world.playerX, newY, PLAYER_SIZE, PLAYER_SIZE)) {
        newX = world.playerX;
      } else {
        newX = world.playerX;
        newY = world.playerY;
      }
    }

    newX = Math.max(0, Math.min(CANVAS_W - PLAYER_SIZE, newX));
    newY = Math.max(0, Math.min(CANVAS_H - PLAYER_SIZE, newY));

    useWorldStore.getState().setPlayerPos(newX, newY);
    useWorldStore.getState().setPlayerDir(dir);

    checkHomeDelivery();
    updateInteractPrompt();
  }

  function checkHomeDelivery() {
    const world = useWorldStore.getState();
    const carrying = world.carryingBrainrot;
    if (!carrying) return;
    if (useUIStore.getState().overlay !== 'none') return;

    const tileX = Math.floor((world.playerX + PLAYER_SIZE / 2) / TILE_SIZE);
    const tileY = Math.floor((world.playerY + PLAYER_SIZE / 2) / TILE_SIZE);

    if (tileX >= HOME_BOUNDS.minCol && tileX <= HOME_BOUNDS.maxCol &&
        tileY >= HOME_BOUNDS.minRow && tileY <= HOME_BOUNDS.maxRow) {
      const def = BRAINROT_MAP.get(carrying.defId);
      if (!def) { world.setCarrying(null); return; }

      const store = useGameStore.getState();

      const mutation = carrying.mutation;
      const mutMult = getMutationMultiplier(mutation);

      if (store.hasEmptySlot()) {
        store.addBrainrot(createOwnedBrainrot(def.id, 'conveyor', mutation));
        store.discoverBrainrot(def.id);
        store.recalcIncome();
        world.setCarrying(null);
        return;
      }

      const newEffectiveIncome = def.baseIncomePerSec * mutMult;
      let worstIdx = -1;
      let worstIncome = Infinity;
      for (let i = 0; i < store.buildingSlots.length; i++) {
        const instId = store.buildingSlots[i];
        if (!instId) continue;
        const o = store.ownedBrainrots.find(b => b.instanceId === instId);
        if (!o) continue;
        const d = BRAINROT_MAP.get(o.defId);
        if (!d) continue;
        const slotIncome = d.baseIncomePerSec * getMutationMultiplier(o.mutation);
        if (slotIncome < worstIncome) {
          worstIncome = slotIncome;
          worstIdx = i;
        }
      }

      if (newEffectiveIncome > worstIncome && worstIdx !== -1) {
        store.clearSlot(worstIdx);
        store.addBrainrot(createOwnedBrainrot(def.id, 'conveyor', mutation));
        store.discoverBrainrot(def.id);
        store.recalcIncome();
        world.setCarrying(null);
      } else {
        useUIStore.getState().openOverlay('slot_replace', { defId: def.id, mutation });
      }
    }
  }

  function getInteractLabel(target: { type: string; label: string; data?: Record<string, unknown> }): string {
    if (target.type === 'shield_device') {
      const store = useGameStore.getState();
      const cost = store.getShieldCost();
      if (store.shield.active) {
        return `Extend Shield ($${formatNumber(cost)})`;
      } else if (store.shield.cooldownSec > 0) {
        return `Shield (CD ${Math.ceil(store.shield.cooldownSec)}s)`;
      }
      return `Activate Shield ($${formatNumber(cost)})`;
    }
    if (target.type === 'npc_building_slot') {
      const baseId = target.data?.baseId as string;
      const npcId = `npc_${baseId}`;
      if (isNPCHome(npcId)) {
        return 'NPC is guarding!';
      }
      return 'Steal Brainrot';
    }
    if (target.type === 'fusion_machine') {
      return 'Fusion Machine';
    }
    return target.label;
  }

  function updateInteractPrompt() {
    const world = useWorldStore.getState();
    const ui = useUIStore.getState();

    const prompt = resolvePrompt(world);
    if (prompt) {
      if (ui.interactObjectId !== prompt.id || ui.interactPrompt !== prompt.label) {
        ui.setInteractPrompt(prompt.label, prompt.id);
      }
    } else if (ui.interactPrompt !== null) {
      ui.setInteractPrompt(null, null);
    }
  }

  function resolvePrompt(world: ReturnType<typeof useWorldStore.getState>): { label: string; id: string } | null {
    if (!world.carryingBrainrot) {
      const nearNPC = findNearbyCarryingNPC();
      if (nearNPC) return { label: '[F] Steal from NPC!', id: nearNPC.npcId };

      const convItem = findNearestConveyorItem(world.playerX, world.playerY);
      if (convItem) return { label: `Pick up ($${formatNumber(convItem.cost)})`, id: convItem.id };
    }

    const target = findNearbyInteractable();
    if (target) return { label: getInteractLabel(target), id: target.id };
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      className="block"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
