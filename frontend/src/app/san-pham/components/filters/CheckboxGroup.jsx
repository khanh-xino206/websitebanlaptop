'use client';

export default function CheckboxGroup({ title, items = [], selected = [], onToggle }) {
  if (!items || items.length === 0) return null;

  return (
    <details open className="filter-group">
      <summary
        className="filter-group-title"
        style={{
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          userSelect: 'none',
        }}
      >
        <span>{title}</span>
        <span className="filter-chevron">›</span>
      </summary>
      <div className="filter-group-body">
        {items.map((item) => {
          const val = typeof item === 'object' ? String(item.id) : String(item);
          const label = typeof item === 'object' ? (item.label || item.ten_NH || item.id) : item;
          const checked = selected.includes(val);
          return (
            <label key={val} className="filter-checkbox-label">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(val)}
              />
              <span>{label}</span>
            </label>
          );
        })}
      </div>
    </details>
  );
}
