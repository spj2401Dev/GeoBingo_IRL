import { FrontendGameMode, normalizeGameMode } from './modes.mjs';

function wordsLeftText(words) {
  const total = words.length;
  const completed = words.filter((word) => word.completed).length;
  const left = Math.max(total - completed, 0);
  return `${left} Words left`;
}

const cameraModeAdapters = {
  [FrontendGameMode.INDIVIDUAL]: {
    getProgressText(words) {
      return wordsLeftText(words);
    },
    getWordStatusText(word) {
      return word.completed ? '✔ Completed' : 'Not completed yet';
    },
    shouldCrossWord() {
      return false;
    },
    canUploadPhoto() {
      return true;
    }
  },
  [FrontendGameMode.SHARED_LOCKED]: {
    getProgressText(words) {
      return wordsLeftText(words);
    },
    getWordStatusText(word, currentPlayerId) {
      if (!word.completed) {
        return 'Open';
      }

      if (word.completedByPlayerId && word.completedByPlayerId === currentPlayerId) {
        return '✔ Completed by you';
      }

      return '✔ Completed by another player';
    },
    shouldCrossWord(word) {
      return Boolean(word.completed);
    },
    canUploadPhoto(word) {
      return !word.completed;
    }
  },
  [FrontendGameMode.BOUNTY_HUNT]: {
    getProgressText(_words, bountyState) {
      if (!bountyState) {
        return 'Bounty Hunt';
      }
      const activeCount = bountyState.activeWord ? 1 : 0;
      const remaining = Number.parseInt(bountyState.remainingCount || 0, 10) || 0;
      return `${activeCount + remaining} Bounties left`;
    },
    getWordStatusText(word) {
      return word.completed ? 'Claimed' : 'Active bounty';
    },
    shouldCrossWord() {
      return false;
    },
    canUploadPhoto(word, _playerId, bountyState) {
      return Boolean(word && bountyState?.phase === 'hunt');
    }
  }
};

export function getCameraModeAdapter(mode) {
  const normalized = normalizeGameMode(mode);
  return cameraModeAdapters[normalized] || cameraModeAdapters[FrontendGameMode.INDIVIDUAL];
}
