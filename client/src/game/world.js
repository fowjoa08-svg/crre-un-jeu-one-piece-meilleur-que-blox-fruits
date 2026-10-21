import * as THREE from 'three';
import { terrainHeight } from './terrain.js';
import { hud, pushMessage, resetHud, setHud } from './store.js';
import { addCoin, clearCoins } from './coins.js';
import { clearFx, spawnFx } from './fx.js';

export const ATTACK_COOLDOWN = 0.45;
export const ATTACK_RANGE = 3.4;
export const ATTACK_DAMAGE = 34;
export const POWER_COOLDOWN = 6;
export const POWER_RANGE = 9;
export const POWER_DAMAGE = 55;

const ENEMY_MAX_HP = 60;

export const world = {
  player: {
    position: new THREE.Vector3(0, 6, 30),
    yaw: 0,
    velocityY: 0,
    grounded: true,
    walkPhase: 0,
    moveAmount: 0,
    attackAt: -10,
    nextAttack: 0,
    powerAt: -10,
    lastHurt: -10,
  },
  camera: { yaw: 0, pitch: 0.34, distance: 9.5 },
  enemies: [],
};

function now() {
  return performance.now() / 1000;
}

function randomSpawnPoint() {
  for (let attempt = 0; attempt < 80; attempt++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 16 + Math.random() * 36;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = terrainHeight(x, z);
    if (y > 1.2) return new THREE.Vector3(x, y, z);
  }
  return new THREE.Vector3(0, terrainHeight(0, 0), 0);
}

export function resetEnemies() {
  world.enemies = Array.from({ length: 12 }, (_, index) => ({
    id: index,
    position: randomSpawnPoint(),
    hp: ENEMY_MAX_HP,
    maxHp: ENEMY_MAX_HP,
    alive: true,
    respawnAt: 0,
    yaw: 0,
    phase: Math.random() * Math.PI * 2,
    nextHit: 0,
    wanderAngle: Math.random() * Math.PI * 2,
  }));
}

resetEnemies();

export function resetWorld() {
  const spawn = spawnPoint();
  world.player.position.copy(spawn);
  world.player.velocityY = 0;
  world.player.yaw = 0;
  world.player.attackAt = -10;
  world.player.powerAt = -10;
  world.player.lastHurt = -10;
  world.camera.yaw = 0;
  world.camera.pitch = 0.34;
  resetEnemies();
  clearCoins();
  clearFx();
  resetHud();
}

export function spawnPoint() {
  return new THREE.Vector3(0, terrainHeight(0, 30) + 0.1, 30);
}

export function damageEnemy(enemy, amount) {
  if (!enemy.alive) return;
  enemy.hp -= amount;
  spawnFx({
    type: 'spark',
    position: enemy.position.clone().setY(enemy.position.y + 1.5),
    life: 0.38,
  });
  if (enemy.hp <= 0) {
    enemy.alive = false;
    enemy.hp = 0;
    enemy.respawnAt = now() + 9;
    addCoin(enemy.position.clone().setY(enemy.position.y + 1.1), 20);
    setHud({ kills: hud.kills + 1 });
    gainXp(45);
    pushMessage('Marine vaincu ! +45 XP');
  }
}

export function playerAttack() {
  const time = now();
  if (time < world.player.nextAttack) return;
  world.player.nextAttack = time + ATTACK_COOLDOWN;
  world.player.attackAt = time;

  const facing = new THREE.Vector3(Math.sin(world.player.yaw), 0, Math.cos(world.player.yaw));
  spawnFx({
    type: 'slash',
    position: world.player.position.clone().addScaledVector(facing, 1.5).setY(world.player.position.y + 1.15),
    rotationY: world.player.yaw,
    life: 0.26,
  });

  world.enemies.forEach((enemy) => {
    if (!enemy.alive) return;
    const toEnemy = enemy.position.clone().sub(world.player.position);
    toEnemy.y = 0;
    const distance = toEnemy.length();
    if (distance > ATTACK_RANGE) return;
    toEnemy.normalize();
    if (toEnemy.dot(facing) < 0.2) return;
    damageEnemy(enemy, ATTACK_DAMAGE);
  });
}

export function usePower() {
  const time = now();
  if (time - world.player.powerAt < POWER_COOLDOWN) return false;
  world.player.powerAt = time;

  spawnFx({
    type: 'burst',
    position: world.player.position.clone().setY(world.player.position.y + 1.1),
    life: 0.75,
  });
  spawnFx({
    type: 'fist',
    position: world.player.position
      .clone()
      .addScaledVector(new THREE.Vector3(Math.sin(world.player.yaw), 0, Math.cos(world.player.yaw)), 3)
      .setY(world.player.position.y + 1.2),
    rotationY: world.player.yaw,
    life: 0.45,
  });

  world.enemies.forEach((enemy) => {
    if (!enemy.alive) return;
    if (enemy.position.distanceTo(world.player.position) < POWER_RANGE) {
      damageEnemy(enemy, POWER_DAMAGE);
    }
  });
  pushMessage('Gomu Gomu no Bazooka !');
  return true;
}

export function damagePlayer(amount) {
  const time = now();
  if (time < world.player.lastHurt + 0.6) return;
  world.player.lastHurt = time;
  const hp = Math.max(0, hud.hp - amount);
  setHud({ hp });
  if (hp <= 0) respawnPlayer();
}

export function respawnPlayer() {
  world.player.position.copy(spawnPoint());
  world.player.velocityY = 0;
  setHud({ hp: hud.maxHp });
  pushMessage('K.O. — retour au port.');
}

export function gainXp(amount) {
  let xp = hud.xp + amount;
  let level = hud.level;
  let xpToNext = hud.xpToNext;
  let maxHp = hud.maxHp;
  let leveledUp = false;

  while (xp >= xpToNext) {
    xp -= xpToNext;
    level += 1;
    xpToNext = Math.round(xpToNext * 1.35);
    maxHp += 10;
    leveledUp = true;
    pushMessage(`Niveau ${level} !`);
  }

  setHud({
    xp,
    level,
    xpToNext,
    maxHp,
    hp: leveledUp ? Math.min(maxHp, hud.hp + 10) : hud.hp,
  });
}

export function serializeGame() {
  const player = world.player;
  return {
    level: hud.level,
    xp: hud.xp,
    xpToNext: hud.xpToNext,
    maxHp: hud.maxHp,
    hp: hud.hp,
    gold: hud.gold,
    kills: hud.kills,
    pos: [Number(player.position.x.toFixed(2)), Number(player.position.z.toFixed(2))],
  };
}

export function applySave(save) {
  resetWorld();
  if (!save || typeof save !== 'object') return;

  const maxHp = clamp(Number(save.maxHp) || 100, 50, 1000);
  setHud({
    level: Number(save.level) || 1,
    xp: Number(save.xp) || 0,
    xpToNext: Number(save.xpToNext) || 100,
    maxHp,
    hp: clamp(Number(save.hp) || maxHp, 1, maxHp),
    gold: Number(save.gold) || 0,
    kills: Number(save.kills) || 0,
  });

  if (Array.isArray(save.pos) && save.pos.length === 2) {
    const [x, z] = save.pos.map(Number);
    const height = terrainHeight(x, z);
    if (Number.isFinite(x) && Number.isFinite(z) && height > -0.9) {
      world.player.position.set(x, height, z);
    }
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
