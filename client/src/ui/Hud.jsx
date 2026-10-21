import { useEffect, useState } from 'react';
import { useHud } from '../game/store.js';
import { POWER_COOLDOWN, world } from '../game/world.js';

function Bar({ label, value, max, tone }) {
  const ratio = Math.max(0, Math.min(1, max > 0 ? value / max : 0));
  return (
    <div className="bar">
      <div className="bar-head">
        <span>{label}</span>
        <span>
          {Math.round(value)} / {Math.round(max)}
        </span>
      </div>
      <div className="bar-track">
        <div className={`bar-fill ${tone}`} style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  );
}

export default function Hud({ user, savedAt, onLogout }) {
  const hud = useHud();
  const [clock, setClock] = useState(0);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const interval = window.setInterval(() => setClock(performance.now() / 1000), 120);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!hud.message) return undefined;
    setToast(hud.message);
    const timeout = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timeout);
  }, [hud.message, hud.messageAt]);

  const remaining = Math.max(0, POWER_COOLDOWN - (clock - world.player.powerAt));
  const powerReady = remaining <= 0;

  return (
    <div className="hud">
      <div className="hud-card hud-player">
        <div className="hud-name">{user.username}</div>
        <div className="hud-level">Niveau {hud.level} · Chasseur de marines</div>
        <Bar label="Vie" value={hud.hp} max={hud.maxHp} tone="hp" />
        <Bar label="Expérience" value={hud.xp} max={hud.xpToNext} tone="xp" />
        <div className="hud-stats">
          <span>🪙 {hud.gold} Berry</span>
          <span>⚓ {hud.kills} marines</span>
        </div>
      </div>

      <div className="hud-card hud-top">
        <div className="fps">
          {hud.fps} FPS<small>cible 180</small>
        </div>
        <div className="save-state">{savedAt ? 'Cloud ✓' : 'Sync…'}</div>
        <button className="hud-logout" type="button" onClick={onLogout}>
          Quitter
        </button>
      </div>

      <div className="hud-power">
        <div className="title">
          <span className="key">E</span>
          Gomu Gomu no Bazooka
        </div>
        <div className={`state ${powerReady ? 'ready' : 'cooling'}`}>
          {powerReady ? 'Prêt' : `Recharge ${remaining.toFixed(1)}s`}
        </div>
      </div>

      <div className="hud-hints">
        ZQSD / WASD — se déplacer · J ou clic — attaquer · E — capacité · Espace — sauter · glisser — caméra
      </div>

      {toast && <div className="hud-toast">{toast}</div>}
    </div>
  );
}
