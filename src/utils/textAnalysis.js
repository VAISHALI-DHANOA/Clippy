export function getWordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function getCharCount(text) {
  return text.length;
}

export function findMatchingReaction(reactions, currentText, previousText, cooldowns) {
  const now = Date.now();

  return reactions.find((reaction, idx) => {
    const lastTriggered = cooldowns[idx] || 0;
    const cooldownPassed = now - lastTriggered > (reaction.cooldown || 30000);

    if (!cooldownPassed) return false;

    const matches = currentText.match(reaction.trigger);
    const prevMatches = previousText.match(reaction.trigger);

    return matches && (!prevMatches || matches.length > prevMatches.length);
  });
}

export function updateCooldown(reactions, reaction, cooldowns) {
  const idx = reactions.indexOf(reaction);
  const now = Date.now();
  return { ...cooldowns, [idx]: now };
}
