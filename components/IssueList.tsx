'use client';
import { useState } from 'react';
import { Issue } from '@/types/audit';

interface Props {
  issues: Issue[];
  title: string;
}

const typeConfig = {
  error:   { symbol: '✕', color: '#d30005', bg: 'rgba(211,0,5,0.06)' },
  warning: { symbol: '!',  color: '#f6c700', bg: 'rgba(246,199,0,0.06)' },
  info:    { symbol: 'i',  color: '#1151ff', bg: 'rgba(17,81,255,0.06)' },
  pass:    { symbol: '✓',  color: '#007d48', bg: 'rgba(0,125,72,0.06)'  },
};

const impactColor: Record<string, string> = {
  high:   '#d30005',
  medium: '#f6c700',
  low:    '#9e9ea0',
};

export default function IssueList({ issues, title }: Props) {
  const [filter, setFilter] = useState<'all' | 'error' | 'warning' | 'pass' | 'info'>('all');
  const [expanded, setExpanded] = useState<number | null>(null);

  const counts = {
    error:   issues.filter(i => i.type === 'error').length,
    warning: issues.filter(i => i.type === 'warning').length,
    info:    issues.filter(i => i.type === 'info').length,
    pass:    issues.filter(i => i.type === 'pass').length,
  };

  const filtered = filter === 'all' ? issues : issues.filter(i => i.type === filter);
  const sorted = [...filtered].sort((a, b) => {
    const order = { error: 0, warning: 1, info: 2, pass: 3 };
    return order[a.type] - order[b.type];
  });

  const filters: { id: typeof filter; label: string; count: number }[] = [
    { id: 'all',     label: 'All',      count: issues.length },
    { id: 'error',   label: 'Errors',   count: counts.error   },
    { id: 'warning', label: 'Warnings', count: counts.warning },
    { id: 'info',    label: 'Info',     count: counts.info    },
    { id: 'pass',    label: 'Pass',     count: counts.pass    },
  ];

  return (
    <div style={{ background: '#ffffff', border: '1px solid #cacacb' }}>
      {/* Header */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid #cacacb',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
      }}>
        <span style={{
          fontSize: 14,
          fontWeight: 500,
          color: '#111111',
        }}>{title}</span>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 500,
                border: filter === f.id ? 'none' : '1px solid #cacacb',
                borderRadius: 9999,
                cursor: 'pointer',
                background: filter === f.id ? '#111111' : '#ffffff',
                color: filter === f.id ? '#ffffff' : '#707072',
                transition: 'background 0.15s, color 0.15s',
                fontFamily: 'inherit',
              }}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      </div>

      {/* Rows */}
      <div>
        {sorted.map((issue, idx) => {
          const cfg = typeConfig[issue.type];
          const isOpen = expanded === idx;
          return (
            <div
              key={idx}
              onClick={() => setExpanded(isOpen ? null : idx)}
              style={{
                padding: '12px 20px',
                borderBottom: '1px solid #e5e5e5',
                cursor: 'pointer',
                opacity: issue.type === 'pass' ? 0.6 : 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                {/* Status indicator */}
                <div style={{
                  flexShrink: 0,
                  width: 22,
                  height: 22,
                  borderRadius: 9999,
                  border: `1.5px solid ${cfg.color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 1,
                }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, lineHeight: 1 }}>
                    {cfg.symbol}
                  </span>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: '#111111',
                      lineHeight: 1.4,
                    }}>{issue.title}</span>
                    {issue.type !== 'pass' && (
                      <span style={{
                        fontSize: 11,
                        fontWeight: 500,
                        color: impactColor[issue.impact],
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                      }}>{issue.impact}</span>
                    )}
                  </div>

                  {isOpen && (
                    <div style={{ marginTop: 8 }}>
                      {issue.description && (
                        <p style={{
                          fontSize: 13,
                          color: '#4b4b4d',
                          lineHeight: 1.5,
                          marginBottom: 8,
                        }}>{issue.description}</p>
                      )}
                      {issue.recommendation && (
                        <div style={{
                          background: cfg.bg,
                          borderLeft: `2px solid ${cfg.color}`,
                          padding: '8px 12px',
                          fontSize: 13,
                          color: '#111111',
                          lineHeight: 1.5,
                        }}>
                          <span style={{ fontWeight: 600 }}>Fix: </span>
                          {issue.recommendation}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <span style={{
                  fontSize: 10,
                  color: '#9e9ea0',
                  flexShrink: 0,
                  marginTop: 4,
                }}>{isOpen ? '▲' : '▼'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
