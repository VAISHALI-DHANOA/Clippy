import React from 'react';

const EYE_VARIANTS = {
  normal: { left: { cx: 36, cy: 28 }, right: { cx: 52, cy: 28 }, size: 3 },
  wide: { left: { cx: 36, cy: 26 }, right: { cx: 52, cy: 26 }, size: 4.5 },
  squint: { left: { cx: 36, cy: 28 }, right: { cx: 52, cy: 28 }, size: 1.5 },
  looking: { left: { cx: 37, cy: 27 }, right: { cx: 53, cy: 27 }, size: 3 },
  wink: { left: { cx: 36, cy: 28 }, right: { cx: 52, cy: 28 }, size: 3, winkRight: true },
};

const MOUTH_VARIANTS = {
  normal: "M 38 38 Q 44 44 50 38",
  wide: "M 35 38 Q 44 48 53 38",
  smirk: "M 38 40 Q 44 44 52 37",
  surprised: "M 40 38 Q 44 44 48 38",
  flat: "M 38 40 L 50 40",
};

const EXPRESSION_CONFIG = {
  happy: { eyes: "normal", mouth: "wide", color: "#4CAF50" },
  sassy: { eyes: "squint", mouth: "smirk", color: "#FF9800" },
  shocked: { eyes: "wide", mouth: "surprised", color: "#f44336" },
  bored: { eyes: "squint", mouth: "flat", color: "#9E9E9E" },
  mischievous: { eyes: "looking", mouth: "smirk", color: "#9C27B0" },
  winking: { eyes: "wink", mouth: "wide", color: "#2196F3" },
};

export default function ClippyCharacter({ expression }) {
  const expr = EXPRESSION_CONFIG[expression] || EXPRESSION_CONFIG.happy;
  const eyes = EYE_VARIANTS[expr.eyes];
  const mouth = MOUTH_VARIANTS[expr.mouth];

  return (
    <svg viewBox="0 0 88 90" style={{ width: 88, height: 90 }}>
      {/* Body - paperclip shape */}
      <path
        d="M 44 5 C 20 5 12 20 12 35 L 12 60 C 12 75 25 85 44 85 C 63 85 76 75 76 60 L 76 35 C 76 20 68 5 44 5 Z"
        fill="none"
        stroke="#607D8B"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* Inner body fill */}
      <path
        d="M 44 10 C 24 10 17 22 17 35 L 17 58 C 17 72 28 80 44 80 C 60 80 71 72 71 58 L 71 35 C 71 22 64 10 44 10 Z"
        fill="#CFD8DC"
        opacity="0.6"
      />
      {/* Eyes */}
      <circle cx={eyes.left.cx} cy={eyes.left.cy} r={eyes.size} fill="#263238" />
      {eyes.winkRight ? (
        <line
          x1={48} y1={eyes.right.cy} x2={56} y2={eyes.right.cy}
          stroke="#263238" strokeWidth="2.5" strokeLinecap="round"
        />
      ) : (
        <circle cx={eyes.right.cx} cy={eyes.right.cy} r={eyes.size} fill="#263238" />
      )}
      {/* Eyebrows */}
      <line
        x1={32} y1={eyes.left.cy - 8} x2={40} y2={eyes.left.cy - 9}
        stroke="#455A64" strokeWidth="1.8" strokeLinecap="round"
      />
      <line
        x1={48} y1={eyes.right.cy - 9} x2={56} y2={eyes.right.cy - 8}
        stroke="#455A64" strokeWidth="1.8" strokeLinecap="round"
      />
      {/* Mouth */}
      <path d={mouth} fill="none" stroke="#455A64" strokeWidth="2" strokeLinecap="round" />
      {/* Blush */}
      <circle cx={28} cy={36} r={4} fill={expr.color} opacity="0.2" />
      <circle cx={60} cy={36} r={4} fill={expr.color} opacity="0.2" />
      {/* Glasses */}
      <circle cx={36} cy={27} r={9} fill="none" stroke="#37474F" strokeWidth="1.5" />
      <circle cx={52} cy={27} r={9} fill="none" stroke="#37474F" strokeWidth="1.5" />
      <line x1={45} y1={27} x2={43} y2={27} stroke="#37474F" strokeWidth="1.5" />
    </svg>
  );
}
