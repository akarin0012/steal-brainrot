import { useEffect, useRef, type RefObject } from 'react';
import { useWorldStore } from '../stores/worldStore.ts';
import { useUIStore } from '../stores/uiStore.ts';
import { useGameStore } from '../stores/gameStore.ts';
import { useGearStore } from '../stores/gearStore.ts';
import { input } from '../engine/input.ts';
import { renderWorld } from '../engine/renderer.ts';
import { BRAINROT_MAP } from '../data/brainrots.ts';
import {
  findNearbyInteractable,
  findNearbyCarryingNPC,
  executeInteract,
  executeNPCSteal,
  tryRecoverFromNPC,
} from '../systems/interact.ts';
import { tickIncome } from '../systems/income.ts';
import { tickNPCs, tickNPCIncome } from '../systems/npcAI.ts';
import {
  tickConveyor,
  getConveyorItems,
  findNearestConveyorItem,
  pickUpConveyorItem,
  setOnSpawnCallback,
  setDequeueCallback,
} from '../systems/conveyor.ts';
import { tickEvents, onBrainrotSpawned, dequeuePity } from '../systems/eventScheduler.ts';
import { MENU_HOTKEY_ENTRIES, DEBUG_OVERLAY_CODE, type MenuOverlayHotkey } from '../config/uiHotkeys.ts';
import { buildSlotContentsMap } from '../game/slotContents.ts';
import { updateOverworld } from '../game/overworld.ts';

function openMenuOverlay(type: MenuOverlayHotkey | 'debug'): void {
  const overlay = useUIStore.getState().overlay;
  if (overlay === type) {
    useUIStore.getState().closeOverlay();
  } else if (overlay === 'none') {
    useUIStore.getState().openOverlay(type);
  }
}

export function useGameCanvasRuntime(canvasRef: RefObject<HTMLCanvasElement | null>): void {
  const lastTimeRef = useRef(performance.now());
  const econTimerRef = useRef(0);
  const saveTimerRef = useRef(0);
  const errorCountRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setOnSpawnCallback(onBrainrotSpawned);
    setDequeueCallback(dequeuePity);

    let animId = 0;

    function gameLoop(now: number) {
      try {
        const rawDt = (now - lastTimeRef.current) / 1000;
        lastTimeRef.current = now;
        const dt = Number.isFinite(rawDt) ? Math.max(0, Math.min(rawDt, 0.1)) : 0;
        if (dt <= 0) {
          animId = requestAnimationFrame(gameLoop);
          return;
        }

        const overlay = useUIStore.getState().overlay;

        const stealOverlayOpen = overlay === 'npc_base_steal';
        if (overlay === 'none' || stealOverlayOpen) {
          tickNPCs(dt);
        }

        tickEvents(dt);
        econTimerRef.current += dt;
        while (econTimerRef.current >= 1) {
          econTimerRef.current -= 1;
          tickIncome();
          useGameStore.getState().tickShield(1);
          tickNPCIncome();
        }

        if (overlay === 'none') {
          useGearStore.getState().tickGears(dt);
          tickConveyor(dt);
          updateOverworld(dt);
        }

        saveTimerRef.current += dt;
        if (saveTimerRef.current >= 5) {
          saveTimerRef.current = 0;
          useGameStore.getState().setLastSaveTime(Date.now());
          useWorldStore.getState().saveNPCState();
        }

        const world = useWorldStore.getState();
        const interactTarget = findNearbyInteractable();
        const convItems = getConveyorItems();
        const nearConvItem = findNearestConveyorItem(world.playerX, world.playerY);

        const game = useGameStore.getState();
        const slotContents = buildSlotContentsMap(game, world);

        const shieldActive = game.shield.active;
        const carrying = world.carryingBrainrot;
        const carryingDef = carrying ? BRAINROT_MAP.get(carrying.defId) ?? null : null;

        const playerSlotCount = game.getPlayerSlotCount();

        renderWorld(
          ctx!,
          world.playerX,
          world.playerY,
          world.playerDir,
          interactTarget,
          convItems,
          nearConvItem,
          slotContents,
          shieldActive,
          carryingDef,
          world.npcs,
          playerSlotCount,
          carrying?.mutation,
        );
        errorCountRef.current = 0;
      } catch (err) {
        errorCountRef.current++;
        if (errorCountRef.current <= 3) {
          console.error('Game loop error:', err);
        }
        if (errorCountRef.current >= 60) {
          console.error('Too many consecutive errors, halting game loop.');
          return;
        }
      }

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
          const stolen = executeNPCSteal(nearNPC.npcId);
          if (stolen) {
            useWorldStore.getState().setCarrying({ defId: stolen.defId, mutation: stolen.mutation, source: 'steal' });
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

    const menuUnsubs = MENU_HOTKEY_ENTRIES.map(({ code, overlay }) =>
      input.onKey(code, () => openMenuOverlay(overlay)),
    );

    const unsubB = input.onKey(DEBUG_OVERLAY_CODE, () => {
      if (!import.meta.env.DEV) return;
      openMenuOverlay('debug');
    });

    const gearUnsubs = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6'].map((key, i) =>
      input.onKey(key, () => {
        if (useUIStore.getState().overlay !== 'none') return;
        const gears = useGearStore.getState().getUnlockedGears();
        if (i < gears.length) {
          useGearStore.getState().useGear(gears[i].id);
        }
      }),
    );

    return () => {
      cancelAnimationFrame(animId);
      unsubF();
      unsubEsc();
      menuUnsubs.forEach(u => u());
      unsubB();
      gearUnsubs.forEach(u => u());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
