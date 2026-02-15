export const ANIMATION_STYLES = `
  @keyframes clippyFloat {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
  }
  @keyframes clippyBounce {
    0% { transform: scale(1); }
    30% { transform: scale(1.15); }
    60% { transform: scale(0.95); }
    100% { transform: scale(1); }
  }
  @keyframes clippyShake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-8px) rotate(-5deg); }
    40% { transform: translateX(8px) rotate(5deg); }
    60% { transform: translateX(-5px) rotate(-3deg); }
    80% { transform: translateX(5px) rotate(3deg); }
  }
  @keyframes clippyPulse {
    0%, 100% { transform: scale(1); box-shadow: 0 4px 15px rgba(123,31,162,0.4); }
    50% { transform: scale(1.08); box-shadow: 0 4px 25px rgba(123,31,162,0.6); }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  textarea::placeholder {
    color: rgba(255,255,255,0.25);
    font-style: italic;
  }
`;

export const BUBBLE_COLORS = {
  normal: { bg: "#FFFDE7", border: "#FDD835" },
  quiz: { bg: "#E8EAF6", border: "#5C6BC0" },
  correct: { bg: "#E8F5E9", border: "#66BB6A" },
  wrong: { bg: "#FFEBEE", border: "#EF5350" },
  ai: { bg: "#F3E5F5", border: "#AB47BC" },
};
