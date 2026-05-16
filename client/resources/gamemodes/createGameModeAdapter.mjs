import { FrontendGameMode, normalizeGameMode } from './modes.mjs';

const createGameModeConfigs = Object.freeze({
  [FrontendGameMode.INDIVIDUAL]: Object.freeze({
    id: FrontendGameMode.INDIVIDUAL,
    tabLabel: 'Individual',
    promptsLabel: 'Prompts per Player',
    defaultPrompts: 9,
    votingEnabled: true,
    skipConfigVisible: false
  }),
  [FrontendGameMode.SHARED_LOCKED]: Object.freeze({
    id: FrontendGameMode.SHARED_LOCKED,
    tabLabel: 'VS Mode',
    promptsLabel: 'Total Prompts',
    defaultPrompts: 12,
    votingEnabled: true,
    skipConfigVisible: false
  }),
  [FrontendGameMode.BOUNTY_HUNT]: Object.freeze({
    id: FrontendGameMode.BOUNTY_HUNT,
    tabLabel: 'Bounty Hunt',
    promptsLabel: 'Total Prompts',
    defaultPrompts: 12,
    votingEnabled: false,
    skipConfigVisible: true
  })
});

export function listCreateGameModes() {
  return [
    createGameModeConfigs[FrontendGameMode.INDIVIDUAL],
    createGameModeConfigs[FrontendGameMode.SHARED_LOCKED],
    createGameModeConfigs[FrontendGameMode.BOUNTY_HUNT]
  ];
}

export function getCreateGameModeConfig(mode) {
  const normalizedMode = normalizeGameMode(mode);
  return createGameModeConfigs[normalizedMode] || createGameModeConfigs[FrontendGameMode.INDIVIDUAL];
}

export function shouldApplyModeDefaultPromptCount(currentValue, previousMode, nextMode) {
  const trimmed = String(currentValue || '').trim();
  if (!trimmed) {
    return true;
  }

  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed)) {
    return true;
  }

  const previousDefault = getCreateGameModeConfig(previousMode).defaultPrompts;
  return parsed === previousDefault;
}
