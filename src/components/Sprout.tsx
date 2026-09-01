type Props = {
  level: number;
  nickname: string;
};

export function Sprout({ level, nickname }: Props) {
  const tall = Math.min(10, Math.max(1, level));
  const stem = 18 + tall * 4;
  const leaf = 8 + tall * 1.2;

  return (
    <div className="flex flex-col items-center">
      <svg width="160" height="160" viewBox="0 0 160 160" aria-hidden>
        <circle cx="80" cy="80" r="72" fill="#EFF6FF" />
        <ellipse cx="80" cy="128" rx="36" ry="8" fill="#DBEAFE" />
        <path
          d={`M80 124 V${124 - stem}`}
          stroke="#2563EB"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <ellipse
          cx={80 - leaf * 1.4}
          cy={124 - stem + 8}
          rx={leaf * 1.6}
          ry={leaf}
          fill="#3B82F6"
          transform={`rotate(-28 ${80 - leaf} ${124 - stem})`}
        />
        <ellipse
          cx={80 + leaf * 1.4}
          cy={124 - stem + 4}
          rx={leaf * 1.5}
          ry={leaf * 0.9}
          fill="#2563EB"
          transform={`rotate(32 ${80 + leaf} ${124 - stem})`}
        />
        {tall >= 6 ? (
          <circle cx="80" cy={124 - stem - 6} r="5" fill="#1D4ED8" />
        ) : null}
      </svg>
      <p className="mt-1 text-lg font-bold">{nickname}</p>
      <p className="text-sm text-mute">레벨 {level}</p>
    </div>
  );
}
