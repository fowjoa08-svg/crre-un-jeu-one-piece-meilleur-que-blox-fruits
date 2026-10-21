# One Piece Legends — RPG 3D

Un RPG 3D dans l'univers de One Piece, jouable dans le navigateur : île procédurale,
océan animé, combat à l'épée, capacité Gomu Gomu no Bazooka, progression (niveau, XP,
Berry) et **comptes joueurs avec sauvegarde cloud** en base Postgres.

## Stack

- **Client** : React + Vite + three.js (via `@react-three/fiber`), rendu procédural
  (aucune texture téléchargée), HUD HTML.
- **API** : Express + Postgres (comptes, sessions JWT en cookie httpOnly, sauvegardes).
- **Single origin** : le serveur Vite proxifie `/api` vers l'API, donc le cookie de
  session reste same-origin.

## Démarrer

```bash
docker compose -f docker-compose.base44.yml up -d --build
```

Puis ouvrir <http://localhost:3000>. L'API a besoin de `JWT_SECRET` (fourni par la
plateforme via `/run/base44/app.env`). Détails, commandes de dev et vérifications :
voir `AGENTS.md`.

## Commandes

| Où        | Commande            | Effet                          |
| --------- | ------------------- | ------------------------------ |
| `client/` | `npm run dev`       | serveur Vite avec hot reload   |
| `server/` | `npm run dev`       | API avec `node --watch`        |
| `client/` | `npm run build`     | build de production du client  |

## Jouer

- **ZQSD / WASD** déplacer · **Maj** courir · **Espace** sauter
- **J** ou clic attaquer · **E** Gomu Gomu no Bazooka (recharge 6 s)
- Glisser à la souris : caméra · molette : zoom
- Les marines poursuivent le joueur ; les vaincre donne de l'XP et des Berry.
- La partie est sauvegardée automatiquement dans le cloud (et à la déconnexion).

La fréquence d'affichage est affichée en haut à droite ; elle n'est pas plafonnée,
elle dépend de la carte graphique.
