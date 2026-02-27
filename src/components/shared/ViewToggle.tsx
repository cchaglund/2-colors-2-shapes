interface ViewToggleProps<T extends string> {
  options: { value: T; label: string }[];
  activeValue: T;
  onChange: (value: T) => void;
}

const toggleStyle = {
  active: {
    background: 'var(--color-card-bg)',
    border: 'var(--border-width, 2px) solid var(--color-border-light)',
    borderRadius: 'var(--radius-sm)',
    boxShadow: 'var(--shadow-btn)',
  } as React.CSSProperties,
  inactive: {
    background: 'transparent',
    border: '1px solid transparent',
    borderRadius: 'var(--radius-sm)',
    boxShadow: 'none',
  } as React.CSSProperties,
};

export function ViewToggle<T extends string>({
  options,
  activeValue,
  onChange,
}: ViewToggleProps<T>) {
  return (
    <div
      className="flex"
      style={{
        background: 'var(--color-selected)',
        borderRadius: 'var(--radius-md)',
        border: 'var(--border-width, 2px) solid var(--color-border-light)',
        padding: 2,
      }}
    >
      {options.map(({ value, label }) => {
        const isActive = activeValue === value;
        return (
          <button
            key={value}
            onClick={() => onChange(value)}
            className={`px-3.5 py-1 text-[11px] transition-all cursor-pointer ${
              isActive
                ? 'text-(--color-text-primary) font-bold'
                : 'text-(--color-text-secondary) font-bold'
            }`}
            style={isActive ? toggleStyle.active : toggleStyle.inactive}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
