'use client';
import { AuditScore } from '@/types/audit';

interface Props {
  auditScore: AuditScore;
  category: string;
  icon: string;
  description: string;
}

function gradeColor(grade: string): string {
  if (grade === 'A') return '#007d48';
  if (grade === 'B') return '#1eaa52';
  if (grade === 'C') return '#f6c700';
  if (grade === 'D') return '#f07800';
  return '#d30005';
}

export default function ScoreCard({ auditScore, category, description }: Props) {
  const color = gradeColor(auditScore.grade);
  const pct = auditScore.score;

  return (
    <div style={{
      background: '#f5f5f5',
      padding: '20px 20px 16px',
    }}>
      <p style={{
        fontSize: 12,
        fontWeight: 500,
        color: '#707072',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}>{category}</p>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 12 }}>
        <span style={{
          fontSize: 56,
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: '-1px',
          color,
        }}>{pct}</span>
        <div style={{ paddingBottom: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: '#9e9ea0' }}>/ 100</div>
          <div style={{
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: '-0.2px',
            color,
            lineHeight: 1,
          }}>Grade {auditScore.grade}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        height: 2,
        background: '#cacacb',
        marginBottom: 8,
      }}>
        <div style={{
          height: 2,
          width: `${pct}%`,
          background: color,
          transition: 'width 0.7s ease',
        }} />
      </div>

      <p style={{
        fontSize: 12,
        fontWeight: 500,
        color: '#707072',
        lineHeight: 1.4,
      }}>{description}</p>
    </div>
  );
}
