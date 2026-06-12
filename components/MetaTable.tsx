'use client';

interface Row {
  label: string;
  value: string | number | boolean | null | undefined;
  status?: 'good' | 'warn' | 'bad' | 'neutral';
}

interface Props {
  title: string;
  rows: Row[];
  icon?: string;
}

const statusColors: Record<string, string> = {
  good:    '#007d48',
  warn:    '#f6c700',
  bad:     '#d30005',
  neutral: '#9e9ea0',
};

function formatVal(val: Row['value']): string {
  if (val === null || val === undefined || val === '') return '—';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  return String(val);
}

export default function MetaTable({ title, rows, icon }: Props) {
  return (
    <div style={{ background: '#ffffff', border: '1px solid #cacacb' }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #cacacb',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: '#f5f5f5',
      }}>
        {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
        <span style={{
          fontSize: 12,
          fontWeight: 500,
          color: '#111111',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>{title}</span>
      </div>

      {/* Rows */}
      <div>
        {rows.map((row, i) => {
          const statusColor = row.status ? statusColors[row.status] : statusColors.neutral;
          const val = formatVal(row.value);
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 16px',
                borderBottom: '1px solid #e5e5e5',
              }}
            >
              {/* Status dot — pill-shaped */}
              <div style={{
                width: 7,
                height: 7,
                borderRadius: 9999,
                background: statusColor,
                flexShrink: 0,
              }} />
              <span style={{
                fontSize: 12,
                fontWeight: 500,
                color: '#707072',
                width: 140,
                flexShrink: 0,
              }}>{row.label}</span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#111111',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                }}
                title={val}
              >{val}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
