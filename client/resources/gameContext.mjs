export function getGameId() {
  const match = window.location.pathname.match(/^\/g\/([^/?#]+)/);
  if (match) {
    return decodeURIComponent(match[1]);
  }
  return new URLSearchParams(window.location.search).get('gameId') || '';
}

export function gamePageUrl(gameId) {
  return `/g/${encodeURIComponent(gameId)}`;
}

export function storageKey(name, explicitGameId = '') {
  const gameId = explicitGameId || getGameId() || 'new-game';
  return `geobingo:${gameId}:${name}`;
}

export function setAdminToken(token, gameId = '') {
  if (token) {
    localStorage.setItem(storageKey('adminToken', gameId), token);
  }
}

export function getAdminToken() {
  return localStorage.getItem(storageKey('adminToken')) || '';
}

export function isAdmin() {
  return Boolean(getAdminToken());
}

export function adminHeaders(extra = {}) {
  const token = getAdminToken();
  return token ? { ...extra, 'x-admin-token': token } : extra;
}

export function setPlayerSession(player, playerToken) {
  localStorage.setItem(storageKey('player'), JSON.stringify(player));
  localStorage.setItem(storageKey('playerToken'), playerToken);
}

export function getPlayerSession() {
  try {
    return JSON.parse(localStorage.getItem(storageKey('player')) || 'null');
  } catch {
    return null;
  }
}

export function getPlayerToken() {
  return localStorage.getItem(storageKey('playerToken')) || '';
}

export function playerHeaders(extra = {}) {
  const player = getPlayerSession();
  const token = getPlayerToken();
  return {
    ...extra,
    ...(player?.id ? { 'x-player-id': player.id } : {}),
    ...(token ? { 'x-player-token': token } : {})
  };
}

export function requireGameId() {
  const gameId = getGameId();
  if (!gameId) {
    throw new Error('Missing game id');
  }
  return gameId;
}
