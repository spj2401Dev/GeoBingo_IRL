export const FrontendGameMode = Object.freeze({
  INDIVIDUAL: 'individual',
  SHARED_LOCKED: 'shared_locked',
  BOUNTY_HUNT: 'bounty_hunt'
});

export function normalizeGameMode(value, fallback = FrontendGameMode.INDIVIDUAL) {
  if (!value) {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();

  if (normalized === FrontendGameMode.SHARED_LOCKED || normalized === 'shared' || normalized === 'shared-locked') {
    return FrontendGameMode.SHARED_LOCKED;
  }

  if (
    normalized === FrontendGameMode.BOUNTY_HUNT
    || normalized === 'bounty'
    || normalized === 'bounty-hunt'
    || normalized === 'infection'
    || normalized === 'tag'
  ) {
    return FrontendGameMode.BOUNTY_HUNT;
  }

  if (normalized === FrontendGameMode.INDIVIDUAL || normalized === 'classic') {
    return FrontendGameMode.INDIVIDUAL;
  }

  return fallback;
}

export function isSharedLockedMode(mode) {
  return normalizeGameMode(mode) === FrontendGameMode.SHARED_LOCKED;
}

export function isBountyMode(mode) {
  return normalizeGameMode(mode) === FrontendGameMode.BOUNTY_HUNT;
}
