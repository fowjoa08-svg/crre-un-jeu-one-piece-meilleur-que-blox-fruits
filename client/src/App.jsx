import { useEffect, useState } from 'react';
import { api } from './api.js';
import AuthScreen from './AuthScreen.jsx';
import GameScreen from './GameScreen.jsx';
import { applySave, resetWorld, serializeGame } from './game/world.js';

export default function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .me()
      .then((data) => {
        if (!active) return;
        if (data.user) {
          applySave(data.save);
          setUser(data.user);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setBooting(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleAuthed = (data) => {
    applySave(data.save ?? null);
    setUser(data.user);
  };

  const handleLogout = async () => {
    try {
      await api.save(serializeGame());
    } catch {
      // offline is fine, the server keeps the previous cloud save
    }
    try {
      await api.logout();
    } catch {
      // ignore, cookie is cleared client-side on next load anyway
    }
    resetWorld();
    setUser(null);
  };

  if (booting) return <div className="boot">Chargement du Grand Line…</div>;
  if (!user) return <AuthScreen onAuthed={handleAuthed} />;
  return <GameScreen user={user} onLogout={handleLogout} />;
}
