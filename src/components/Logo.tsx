export function Mark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect width="32" height="32" rx="9" fill="var(--brand)" />
      <path
        d="M6 17.4h4.1l2.2-5.6 3.1 9.6 2.7-7 1.7 3h6.2"
        stroke="var(--brand-ink)"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Mark size={compact ? 26 : 30} />
      {!compact ? (
        <span className="flex flex-col leading-none">
          <span className="text-[15px] font-semibold tracking-[-0.02em] text-ink">Vitalis</span>
          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-ink-3">Health</span>
        </span>
      ) : null}
    </span>
  )
}
