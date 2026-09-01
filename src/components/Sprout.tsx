type Props = {
  level: number;
  nickname?: string;
  compact?: boolean;
};

export function Sprout({ level, nickname, compact = false }: Props) {
  const tall = Math.min(10, Math.max(1, level));
  const stem = 18 + tall * 4;
  const leaf = 8 + tall * 1.2;
  const size = compact ? 88 : 160;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox="0 0 160 160" aria-hidden>
        <circle cx="80" cy="80" r="72" fill="#ffffff" fillOpacity="0.55" />
        <ellipse cx="80" cy="128" rx="36" ry="8" fill="#4CAF2A" fillOpacity="0.2" />
        <path
          d={`M80 124 V${124 - stem}`}
          stroke="#111111"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <ellipse
          cx={80 - leaf * 1.4}
          cy={124 - stem + 8}
          rx={leaf * 1.6}
          ry={leaf}
          fill="#4CAF2A"
          transform={`rotate(-28 ${80 - leaf} ${124 - stem})`}
        />
        <ellipse
          cx={80 + leaf * 1.4}
          cy={124 - stem + 4}
          rx={leaf * 1.5}
          ry={leaf * 0.9}
          fill="#111111"
          transform={`rotate(32 ${80 + leaf} ${124 - stem})`}
        />
      </svg>
      {compact ? null : (
        <>
          <p className="mt-1 text-lg font-extrabold">{nickname}</p>
          <p className="text-sm text-mute">레벨 {level}</p>
        </>
      )}
    </div>
  );
}
