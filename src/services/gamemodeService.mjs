import crypto from 'crypto';
import { GameMode } from '../enums/gameModeEnum.mjs';
import { BingoWord } from '../models/word.mjs';
import webSocketService from './webSocketService.mjs';

const BOUNTY_CANDIDATE_COUNT = 3;
const BOUNTY_SELECTION_TIMEOUT_MS = 10_000;

const modeAliases = new Map([
  [GameMode.INDIVIDUAL, GameMode.INDIVIDUAL],
  ['classic', GameMode.INDIVIDUAL],
  [GameMode.SHARED_LOCKED, GameMode.SHARED_LOCKED],
  ['shared', GameMode.SHARED_LOCKED],
  ['shared-locked', GameMode.SHARED_LOCKED],
  [GameMode.BOUNTY_HUNT, GameMode.BOUNTY_HUNT],
  ['bounty', GameMode.BOUNTY_HUNT],
  ['bounty-hunt', GameMode.BOUNTY_HUNT],
  ['infection', GameMode.BOUNTY_HUNT],
  ['tag', GameMode.BOUNTY_HUNT]
]);

function createModeError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function normalizeWordLabel(label) {
  return String(label || '').trim().toLowerCase();
}

function normalizeTeamKey(teamName) {
  return String(teamName || '').trim().toLowerCase();
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickWordLabels(source, amount) {
  return shuffle(source).slice(0, amount);
}

function uniqueWordLabels(source) {
  const seen = new Set();
  const result = [];

  for (const rawLabel of source) {
    const normalized = normalizeWordLabel(rawLabel);
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    result.push(String(rawLabel).trim());
  }

  return result;
}

function buildWordsFromLabels(labels) {
  return labels.map((label) => new BingoWord(label));
}

function ensureModeState(game) {
  if (!game.modeState || typeof game.modeState !== 'object') {
    game.modeState = {};
  }
  return game.modeState;
}

function getSharedWordLabels(game) {
  const modeState = ensureModeState(game);
  if (!Array.isArray(modeState.sharedWordLabels) || modeState.sharedWordLabels.length === 0) {
    modeState.sharedWordLabels = pickWordLabels(game.words, game.wordsPerPlayer);
  }
  return modeState.sharedWordLabels;
}

function findCompletedWordForLabel(game, normalizedLabel) {
  for (const player of game.players) {
    for (const word of player.words) {
      if (normalizeWordLabel(word.label) === normalizedLabel && word.completed) {
        return { player, word };
      }
    }
  }
  return null;
}

function applyToAllWordsForLabel(game, label, updater) {
  const normalizedLabel = normalizeWordLabel(label);
  for (const player of game.players) {
    for (const word of player.words) {
      if (normalizeWordLabel(word.label) === normalizedLabel) {
        updater(word, player);
      }
    }
  }
}

function countSharedCompletions(player) {
  const completedLabels = new Set();
  for (const word of player.words) {
    if (word.completed && word.completedByPlayerId === player.id) {
      completedLabels.add(normalizeWordLabel(word.label));
    }
  }
  return completedLabels.size;
}

function ensureBountyState(game) {
  const modeState = ensureModeState(game);
  if (!modeState.bounty || typeof modeState.bounty !== 'object') {
    modeState.bounty = {
      initialized: false,
      activeLabel: null,
      remainingLabels: [],
      selectionCandidates: [],
      selectionEndsAt: null,
      selectionToken: null,
      selectionOwnerType: null,
      selectionOwnerKey: null,
      selectionTimer: null,
      playerScores: {},
      teamScores: {},
      claimOwnersByWordId: {}
    };
  }
  return modeState.bounty;
}

function getBountyOwner(player) {
  const teamKey = normalizeTeamKey(player.teamName);
  if (teamKey) {
    return { type: 'team', key: teamKey };
  }
  return { type: 'player', key: player.id };
}

function getScoreMap(bountyState, owner) {
  return owner.type === 'team' ? bountyState.teamScores : bountyState.playerScores;
}

function getOwnerScore(bountyState, owner) {
  return getScoreMap(bountyState, owner)[owner.key] || 0;
}

function adjustOwnerScore(bountyState, owner, delta) {
  const scoreMap = getScoreMap(bountyState, owner);
  const next = (scoreMap[owner.key] || 0) + delta;
  scoreMap[owner.key] = next;
  return next;
}

function clearSelectionTimer(bountyState) {
  if (bountyState.selectionTimer) {
    clearTimeout(bountyState.selectionTimer);
    bountyState.selectionTimer = null;
  }
}

function clearSelectionState(bountyState) {
  clearSelectionTimer(bountyState);
  bountyState.selectionCandidates = [];
  bountyState.selectionEndsAt = null;
  bountyState.selectionToken = null;
  bountyState.selectionOwnerType = null;
  bountyState.selectionOwnerKey = null;
}

function removeLabelFromRemaining(bountyState, label) {
  const normalizedWanted = normalizeWordLabel(label);
  const index = bountyState.remainingLabels.findIndex((item) => normalizeWordLabel(item) === normalizedWanted);
  if (index < 0) {
    return null;
  }
  return bountyState.remainingLabels.splice(index, 1)[0];
}

function initializeBountyState(game) {
  const bountyState = ensureBountyState(game);
  if (bountyState.initialized) {
    return bountyState;
  }

  const pool = shuffle(uniqueWordLabels(game.words));
  const activeLabel = pool.shift() || null;
  bountyState.initialized = true;
  bountyState.activeLabel = activeLabel;
  bountyState.remainingLabels = pool;
  bountyState.selectionCandidates = [];
  bountyState.selectionEndsAt = null;
  bountyState.selectionToken = null;
  bountyState.selectionOwnerType = null;
  bountyState.selectionOwnerKey = null;
  bountyState.playerScores = {};
  bountyState.teamScores = {};
  bountyState.claimOwnersByWordId = {};
  clearSelectionTimer(bountyState);
  return bountyState;
}

function activateNextBounty(game, selectedLabel) {
  const bountyState = initializeBountyState(game);
  const pickedLabel = removeLabelFromRemaining(bountyState, selectedLabel);
  if (!pickedLabel) {
    throw createModeError('Selected bounty is not available');
  }
  clearSelectionState(bountyState);
  bountyState.activeLabel = pickedLabel;
  webSocketService.sendToGame(game.id, 'BOUNTY_UPDATED', null);
  return pickedLabel;
}

function startBountySelection(game, selectingOwner) {
  const bountyState = initializeBountyState(game);

  bountyState.activeLabel = null;
  clearSelectionState(bountyState);

  if (bountyState.remainingLabels.length === 0) {
    webSocketService.sendToGame(game.id, 'BOUNTY_UPDATED', null);
    return;
  }

  bountyState.selectionCandidates = shuffle(bountyState.remainingLabels)
    .slice(0, Math.min(BOUNTY_CANDIDATE_COUNT, bountyState.remainingLabels.length));
  bountyState.selectionEndsAt = new Date(Date.now() + BOUNTY_SELECTION_TIMEOUT_MS).toISOString();
  bountyState.selectionOwnerType = selectingOwner?.type || null;
  bountyState.selectionOwnerKey = selectingOwner?.key || null;

  const token = crypto.randomUUID();
  bountyState.selectionToken = token;
  bountyState.selectionTimer = setTimeout(() => {
    const currentState = ensureBountyState(game);
    if (currentState.selectionToken !== token || currentState.selectionCandidates.length === 0) {
      return;
    }
    const fallbackLabel = shuffle(currentState.selectionCandidates)[0];
    try {
      activateNextBounty(game, fallbackLabel);
    } catch {
      clearSelectionState(currentState);
    }
  }, BOUNTY_SELECTION_TIMEOUT_MS);

  webSocketService.sendToGame(game.id, 'BOUNTY_UPDATED', null);
}

function canPlayerSelectBounty(bountyState, player) {
  if (bountyState.selectionCandidates.length === 0) {
    return false;
  }

  const ownerType = bountyState.selectionOwnerType;
  const ownerKey = bountyState.selectionOwnerKey;
  if (!ownerType || !ownerKey) {
    return true;
  }

  if (ownerType === 'team') {
    return normalizeTeamKey(player.teamName) === ownerKey;
  }

  return player.id === ownerKey;
}

function getBountyVisibleWordForPlayer(game, player) {
  const bountyState = initializeBountyState(game);
  if (!bountyState.activeLabel || bountyState.selectionCandidates.length > 0) {
    return [];
  }

  const activeWord = player.words.find(
    (word) => normalizeWordLabel(word.label) === normalizeWordLabel(bountyState.activeLabel)
  );
  return activeWord ? [activeWord] : [];
}

function getBountyStateForPlayer(game, player) {
  const bountyState = initializeBountyState(game);
  const owner = getBountyOwner(player);
  const ownerScore = getOwnerScore(bountyState, owner);
  const hasSelection = bountyState.selectionCandidates.length > 0;

  return {
    phase: hasSelection ? 'selection' : (bountyState.activeLabel ? 'hunt' : 'finished'),
    activeWord: hasSelection ? null : bountyState.activeLabel,
    selectionCandidates: [...bountyState.selectionCandidates],
    selectionEndsAt: bountyState.selectionEndsAt,
    remainingCount: bountyState.remainingLabels.length,
    score: ownerScore,
    scoreKind: owner.type,
    canSelect: canPlayerSelectBounty(bountyState, player),
    skipEnabled: Boolean(game.allowSkip),
    canSkip: Boolean(game.allowSkip && !hasSelection && bountyState.activeLabel && ownerScore > 0)
  };
}

function chooseNextBountyPrompt(game, player, selectedLabel) {
  const bountyState = initializeBountyState(game);
  if (bountyState.selectionCandidates.length === 0) {
    throw createModeError('No bounty selection is currently active');
  }
  if (!canPlayerSelectBounty(bountyState, player)) {
    throw createModeError('Only the player/team that claimed the last bounty can choose next');
  }

  const normalizedSelected = normalizeWordLabel(selectedLabel);
  if (!normalizedSelected) {
    throw createModeError('Selected bounty is invalid');
  }

  const candidate = bountyState.selectionCandidates.find(
    (label) => normalizeWordLabel(label) === normalizedSelected
  );
  if (!candidate) {
    throw createModeError('Selected bounty is not one of the available options');
  }

  activateNextBounty(game, candidate);
  return {
    selectedByPlayerId: player.id,
    bounty: getBountyStateForPlayer(game, player)
  };
}

function skipBountyPrompt(game, player) {
  if (!game.allowSkip) {
    throw createModeError('Skipping is disabled for this game');
  }

  const bountyState = initializeBountyState(game);
  if (bountyState.selectionCandidates.length > 0) {
    throw createModeError('Cannot skip while next bounty is being selected');
  }

  if (!bountyState.activeLabel) {
    throw createModeError('No active bounty to skip');
  }

  const owner = getBountyOwner(player);
  if (getOwnerScore(bountyState, owner) < 1) {
    throw createModeError('Not enough points to skip');
  }

  adjustOwnerScore(bountyState, owner, -1);
  startBountySelection(game, owner);
  return {
    skippedByPlayerId: player.id,
    bounty: getBountyStateForPlayer(game, player)
  };
}

function buildBountyRankings(game) {
  const bountyState = initializeBountyState(game);
  const groups = new Map();

  for (const player of game.players) {
    const isTeam = Boolean(player.teamName);
    const key = isTeam ? `team:${normalizeTeamKey(player.teamName)}` : `player:${player.id}`;
    const displayName = isTeam ? player.teamName : player.name;
    const score = isTeam
      ? (bountyState.teamScores[normalizeTeamKey(player.teamName)] || 0)
      : (bountyState.playerScores[player.id] || 0);

    if (!groups.has(key)) {
      groups.set(key, {
        id: key,
        name: displayName,
        isTeam,
        members: [],
        completedPhotos: score,
        votesScore: 0,
        penaltyPoints: 0,
        totalScore: score
      });
    }

    const group = groups.get(key);
    group.members.push(player.name);
  }

  return Array.from(groups.values()).sort((a, b) => b.totalScore - a.totalScore);
}

export function parseGameMode(value, { fallback = GameMode.INDIVIDUAL } = {}) {
  const normalizedFallback = modeAliases.get(String(fallback || '').trim().toLowerCase()) || GameMode.INDIVIDUAL;

  if (value === undefined || value === null || value === '') {
    return normalizedFallback;
  }

  const normalized = String(value).trim().toLowerCase();
  const parsed = modeAliases.get(normalized);

  if (!parsed) {
    throw createModeError('Unsupported game mode');
  }

  return parsed;
}

const gameModeAdapters = {
  [GameMode.INDIVIDUAL]: {
    createWordsForPlayer(game) {
      return buildWordsFromLabels(pickWordLabels(game.words, game.wordsPerPlayer));
    },
    assertCanUploadPhoto() {},
    onPhotoUploaded(_game, player, word) {
      word.completedByPlayerId = player.id;
    },
    onPhotoDeclined(_game, _player, word) {
      word.completedByPlayerId = null;
    },
    applyDeclinePenalty() {
      return false;
    },
    getCompletedPhotosForPlayer(player) {
      return player.words.filter((word) => word.completed).length;
    }
  },
  [GameMode.SHARED_LOCKED]: {
    createWordsForPlayer(game) {
      return buildWordsFromLabels(getSharedWordLabels(game));
    },
    assertCanUploadPhoto(game, player, targetWord) {
      const normalizedLabel = normalizeWordLabel(targetWord?.label);
      if (!normalizedLabel) {
        throw createModeError('Prompt not found for player', 404);
      }

      const completedEntry = findCompletedWordForLabel(game, normalizedLabel);
      if (!completedEntry) {
        return;
      }

      if (completedEntry.player.id === player.id) {
        throw createModeError('This prompt is already completed and cannot be reuploaded');
      }

      throw createModeError('This prompt was already completed by another player');
    },
    onPhotoUploaded(game, player, targetWord) {
      applyToAllWordsForLabel(game, targetWord.label, (word) => {
        word.completedByPlayerId = player.id;
        if (word.id !== targetWord.id) {
          word.completed = true;
          word.photo = null;
          word.photoPath = null;
          word.votes = 0;
        }
      });
    },
    onPhotoDeclined(game, _player, targetWord) {
      applyToAllWordsForLabel(game, targetWord.label, (word) => {
        word.completed = false;
        word.photo = null;
        word.photoPath = null;
        word.votes = 0;
        word.completedByPlayerId = null;
      });
    },
    applyDeclinePenalty() {
      return false;
    },
    getCompletedPhotosForPlayer(player) {
      return countSharedCompletions(player);
    }
  },
  [GameMode.BOUNTY_HUNT]: {
    createWordsForPlayer(game) {
      return buildWordsFromLabels(uniqueWordLabels(game.words));
    },
    onGameStarted(game) {
      initializeBountyState(game);
      webSocketService.sendToGame(game.id, 'BOUNTY_UPDATED', null);
    },
    clearModeState(game) {
      const bountyState = ensureBountyState(game);
      clearSelectionState(bountyState);
    },
    getVisibleWordsForPlayer(game, player) {
      return getBountyVisibleWordForPlayer(game, player);
    },
    getPlayerState(game, player) {
      return getBountyStateForPlayer(game, player);
    },
    assertCanUploadPhoto(game, _player, targetWord) {
      const bountyState = initializeBountyState(game);
      if (bountyState.selectionCandidates.length > 0) {
        throw createModeError('Please wait until the next bounty is selected');
      }

      if (!bountyState.activeLabel) {
        throw createModeError('No active bounty is available right now');
      }

      if (normalizeWordLabel(targetWord?.label) !== normalizeWordLabel(bountyState.activeLabel)) {
        throw createModeError('Only the active bounty prompt can be submitted');
      }

      if (targetWord.completed) {
        throw createModeError('This prompt is already completed and cannot be reuploaded');
      }
    },
    onPhotoUploaded(game, player, targetWord) {
      const bountyState = initializeBountyState(game);
      const owner = getBountyOwner(player);
      adjustOwnerScore(bountyState, owner, 1);
      bountyState.claimOwnersByWordId[targetWord.id] = {
        ownerType: owner.type,
        ownerKey: owner.key,
        awardedPoints: 1,
        reverted: false
      };
      targetWord.completedByPlayerId = player.id;
      startBountySelection(game, owner);
    },
    onPhotoDeclined(game, player, targetWord) {
      const bountyState = initializeBountyState(game);
      const claimOwner = bountyState.claimOwnersByWordId[targetWord.id];
      if (!claimOwner || claimOwner.reverted) {
        return;
      }

      const owner = { type: claimOwner.ownerType, key: claimOwner.ownerKey };
      adjustOwnerScore(bountyState, owner, -Math.abs(claimOwner.awardedPoints || 1));
      claimOwner.reverted = true;
      targetWord.completedByPlayerId = null;
      webSocketService.sendToGame(game.id, 'BOUNTY_UPDATED', null);

      // If ownership metadata is missing, fallback to uploader's current pool owner.
      if (!claimOwner.ownerKey) {
        const fallbackOwner = getBountyOwner(player);
        claimOwner.ownerType = fallbackOwner.type;
        claimOwner.ownerKey = fallbackOwner.key;
      }
    },
    applyDeclinePenalty(game, player, targetWord, removePoints) {
      if (!removePoints) {
        return true;
      }

      const bountyState = initializeBountyState(game);
      const claimOwner = bountyState.claimOwnersByWordId[targetWord.id];
      const owner = claimOwner
        ? { type: claimOwner.ownerType, key: claimOwner.ownerKey }
        : getBountyOwner(player);
      adjustOwnerScore(bountyState, owner, -1);
      webSocketService.sendToGame(game.id, 'BOUNTY_UPDATED', null);
      return true;
    },
    chooseNextBountyPrompt(game, player, selectedLabel) {
      return chooseNextBountyPrompt(game, player, selectedLabel);
    },
    skipActiveBounty(game, player) {
      return skipBountyPrompt(game, player);
    },
    getCompletedPhotosForPlayer(player) {
      return player.words.filter((word) => word.completed).length;
    },
    buildRankings(game) {
      return buildBountyRankings(game);
    }
  }
};

export function getGameModeAdapter(game) {
  const gameMode = parseGameMode(game?.gameMode, { fallback: GameMode.INDIVIDUAL });
  const adapter = gameModeAdapters[gameMode];

  if (!adapter) {
    throw createModeError('Unsupported game mode');
  }

  return adapter;
}

export function getVisibleWordsForPlayer(game, player) {
  const adapter = getGameModeAdapter(game);
  if (adapter.getVisibleWordsForPlayer) {
    return adapter.getVisibleWordsForPlayer(game, player);
  }
  return player.words;
}

export function getModeStateForPlayer(game, player) {
  const adapter = getGameModeAdapter(game);
  if (!adapter.getPlayerState) {
    return null;
  }
  return adapter.getPlayerState(game, player);
}

export function chooseBountyPrompt(game, player, selectedLabel) {
  const adapter = getGameModeAdapter(game);
  if (!adapter.chooseNextBountyPrompt) {
    throw createModeError('Prompt selection is not available in this game mode');
  }
  return adapter.chooseNextBountyPrompt(game, player, selectedLabel);
}

export function skipBounty(game, player) {
  const adapter = getGameModeAdapter(game);
  if (!adapter.skipActiveBounty) {
    throw createModeError('Skipping is not available in this game mode');
  }
  return adapter.skipActiveBounty(game, player);
}
