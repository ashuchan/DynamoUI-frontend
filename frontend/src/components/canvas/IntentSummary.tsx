import type {
  AestheticMood,
  CanvasIntent,
  DensityPreference,
  Domain,
  OperationProfile,
} from '../../types/canvas';

const DOMAIN_LABELS: Record<Domain, string> = {
  fintech: 'Fintech',
  logistics: 'Logistics',
  hr: 'HR',
  saas_b2b: 'SaaS B2B',
  healthcare: 'Healthcare',
  ecommerce: 'E-commerce',
  legal: 'Legal',
  education: 'Education',
  manufacturing: 'Manufacturing',
  generic: 'Generic',
};

const MOOD_LABELS: Record<AestheticMood, string> = {
  enterprise: 'Enterprise',
  functional: 'Functional',
  modern_saas: 'Modern SaaS',
  friendly: 'Friendly',
  clinical: 'Clinical',
  bold_consumer: 'Bold Consumer',
};

const PROFILE_LABELS: Record<OperationProfile, string> = {
  read_heavy: 'Read-heavy',
  write_heavy: 'Write-heavy',
  review_audit: 'Review / Audit',
  mixed: 'Mixed',
};

const DENSITY_LABELS: Record<DensityPreference, string> = {
  compact: 'Compact',
  standard: 'Standard',
  comfortable: 'Comfortable',
};

interface Props {
  intent: Partial<CanvasIntent>;
}

export function IntentSummary({ intent }: Props) {
  const chips: { label: string; value: string }[] = [];
  if (intent.domain) chips.push({ label: 'Domain', value: DOMAIN_LABELS[intent.domain] });
  if (intent.aesthetic_mood)
    chips.push({ label: 'Theme', value: MOOD_LABELS[intent.aesthetic_mood] });
  if (intent.operation_profile)
    chips.push({ label: 'Mode', value: PROFILE_LABELS[intent.operation_profile] });
  if (intent.density)
    chips.push({ label: 'Density', value: DENSITY_LABELS[intent.density] });
  if (intent.primary_entity)
    chips.push({ label: 'Primary', value: intent.primary_entity });

  if (chips.length === 0) {
    return (
      <p
        className="text-xs text-dui-text-muted"
        data-testid="canvas-intent-empty"
      >
        Intent will appear here as the conversation progresses
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2" data-testid="canvas-intent-chips">
      {chips.map(({ label, value }) => (
        <span
          key={label}
          data-testid={`canvas-chip-${label.toLowerCase()}`}
          className="inline-flex items-center gap-1 rounded-full bg-dui-surface-tertiary px-2 py-0.5 text-xs text-dui-text-primary"
        >
          <span className="text-dui-text-muted">{label}:</span>
          <span className="font-medium">{value}</span>
        </span>
      ))}
    </div>
  );
}
