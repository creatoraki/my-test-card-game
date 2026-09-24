import type { EnemyState, InputState, PlayerState, WorldEvent } from "../types";
import { cameraTarget, followCamera } from "./camera";
import { stepEnemy, createEnemy } from "./enemyAi";
import { ENEMIES } from "./level";
import { createPlayer, stepPlayer } from "./playerPhysics";

export interface WorldState {
  player: PlayerState;
  enemies: EnemyState[];
  camera: number;
  time: number;
}

export function createWorld(): WorldState {
  const player = createPlayer();
  return {
    player,
    enemies: ENEMIES.map(createEnemy),
    camera: cameraTarget(player.x, player.facing),
    time: 0,
  };
}

/** 固定步长推进整个世界；离散事件通过 emit 抛给界面层。 */
export function stepWorld(world: WorldState, input: InputState, dt: number, emit: (event: WorldEvent) => void) {
  world.time += dt;
  if (stepPlayer(world.player, input, dt)) emit({ type: "respawn" });
  input.jumpPressed = false;
  for (const enemy of world.enemies) {
    const mode = stepEnemy(enemy, world.player, dt);
    if (mode) emit({ type: "enemyMode", id: enemy.id, mode });
  }
  world.camera = followCamera(world.camera, cameraTarget(world.player.x, world.player.facing), dt);
}
