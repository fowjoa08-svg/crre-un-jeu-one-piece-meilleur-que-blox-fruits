import { useState } from 'react';
import { api } from './api.js';

export default function AuthScreen({ onAuthed }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      const data = mode === 'login' ? await api.login(username, password) : await api.register(username, password);
      onAuthed(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <p className="auth-kicker">Grand Line · RPG 3D</p>
        <h1 className="auth-title">One Piece<br />Legends</h1>
        <p className="auth-sub">
          Prends la mer, affronte la Marine et deviens le roi des pirates. Ta progression est
          sauvegardée dans le cloud.
        </p>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === 'login' ? 'active' : ''}
            onClick={() => {
              setMode('login');
              setError('');
            }}
          >
            Connexion
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'active' : ''}
            onClick={() => {
              setMode('register');
              setError('');
            }}
          >
            Créer un compte
          </button>
        </div>

        <form onSubmit={submit}>
          {error && <p className="auth-error">{error}</p>}

          <label className="auth-field">
            <span>Pseudo</span>
            <input
              name="username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="luffy"
              maxLength={20}
              required
            />
          </label>

          <label className="auth-field">
            <span>Mot de passe</span>
            <input
              name="password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••"
              minLength={6}
              required
            />
          </label>

          <button className="auth-submit" type="submit" disabled={busy}>
            {busy ? 'Un instant…' : mode === 'login' ? 'Prendre la mer' : 'Embarquer'}
          </button>
        </form>

        <p className="auth-note">
          {mode === 'login'
            ? 'Pas encore de compte ? Choisis « Créer un compte » pour repartir de zéro.'
            : '3 à 20 caractères pour le pseudo, 6 minimum pour le mot de passe.'}
        </p>
      </div>
    </div>
  );
}
