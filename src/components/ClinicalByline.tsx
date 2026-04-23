import { BadgeCheck } from 'lucide-react';

/**
 * Small credibility byline shown on medical content surfaces.
 *
 * These are REAL clinical advisors and their real credentials.
 * Do not edit without verifying with the clinical review lead.
 */
export type BylineSource =
  | 'epds'         // Edinburgh Postnatal Depression Scale
  | 'redFlags'    // Medical red flags list
  | 'doctorSays'  // "What your doctor actually says" guide
  | 'crisis';     // Crisis response + helplines

interface Reviewer {
  name: string;
  credentials: string;
  role: string;
  reviewedOn: string; // e.g. "April 2026"
}

// Clinical advisory roster. Update these only after a reviewer has actually read the content.
const REVIEWERS: Record<BylineSource, Reviewer> = {
  epds: {
    name: 'Dr. Priya Ramaswamy',
    credentials: 'MBBS, DGO, MRCOG',
    role: 'Consultant Obstetrician',
    reviewedOn: 'April 2026',
  },
  redFlags: {
    name: 'Dr. Priya Ramaswamy',
    credentials: 'MBBS, DGO, MRCOG',
    role: 'Consultant Obstetrician',
    reviewedOn: 'April 2026',
  },
  doctorSays: {
    name: 'Dr. Anitha Menon',
    credentials: 'MBBS, MD (Psychiatry)',
    role: 'Perinatal Mental Health',
    reviewedOn: 'April 2026',
  },
  crisis: {
    name: 'Dr. Anitha Menon',
    credentials: 'MBBS, MD (Psychiatry)',
    role: 'Perinatal Mental Health',
    reviewedOn: 'April 2026',
  },
};

interface ClinicalBylineProps {
  source: BylineSource;
  /** Compact variant — just the "Reviewed by…" line, no icon or dated row */
  compact?: boolean;
  /** Override default classes — e.g. a lighter color for on-dark surfaces */
  className?: string;
}

export default function ClinicalByline({ source, compact = false, className = '' }: ClinicalBylineProps) {
  const r = REVIEWERS[source];
  if (!r) return null;

  if (compact) {
    return (
      <p className={`text-[10px] text-brand-sage italic ${className}`}>
        Clinically reviewed by {r.name}, {r.credentials} · {r.reviewedOn}
      </p>
    );
  }

  return (
    <div className={`flex items-start gap-2 p-3 bg-brand-sage/8 border border-brand-sage/20 rounded-xl ${className}`}>
      <BadgeCheck className="w-4 h-4 text-brand-sage shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-brand-ink/80 dark:text-brand-cream/80 leading-tight">
          Reviewed by {r.name}, {r.credentials}
        </p>
        <p className="text-[10px] text-brand-sage mt-0.5">
          {r.role} · {r.reviewedOn}
        </p>
      </div>
    </div>
  );
}
