import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Activity, MilitaryUnit } from '../../types';
import { ActivityWidget, UnitWidget, WidgetShell } from './widgetShared';

export default function WidgetPage() {
  const [searchParams] = useSearchParams();

  const unitParam = searchParams.get('unit') || '';
  const defaultUnitParam = searchParams.get('default-unit') || '';
  const activityParam = searchParams.get('activity') || '';
  const defaultActivityParam = searchParams.get('default-activity') || '';
  const amountParam = parseFloat(searchParams.get('amount') || '0') || 500;
  const titleParam = searchParams.get('title') || null;

  const hasUnitHint = !!(unitParam || defaultUnitParam);
  const hasActivityHint = !!(activityParam || defaultActivityParam);
  const defaultMode: 'unit' | 'activity' = hasActivityHint ? 'activity' : 'unit';
  const [mode, setMode] = useState<'unit' | 'activity'>(defaultMode);
  const showToggle = !hasUnitHint && !hasActivityHint;
  const effectiveMode = showToggle ? mode : (hasActivityHint ? 'activity' : 'unit');

  const { data: units = [] } = useQuery<MilitaryUnit[]>({
    queryKey: ['military-units'],
    queryFn: () => api.get<MilitaryUnit[]>('/military-units').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const { data: activities = [] } = useQuery<Activity[]>({
    queryKey: ['activities'],
    queryFn: () => api.get<Activity[]>('/activities').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const { data: shopConfig } = useQuery<{ accountNumber: string; iban: string }>({
    queryKey: ['shop-config'],
    queryFn: () => api.get('/config').then(r => r.data),
    staleTime: Infinity,
  });

  const fixedUnit = unitParam ? units.find(u => u.slug === unitParam) : undefined;
  const defaultUnit = defaultUnitParam ? units.find(u => u.slug === defaultUnitParam) : undefined;
  const fixedActivity = activityParam ? activities.find(a => a.code === activityParam) : undefined;
  const defaultActivity = defaultActivityParam ? activities.find(a => a.code === defaultActivityParam) : undefined;

  return (
    <WidgetShell>
      {showToggle && (
        <div className="grid grid-cols-2 gap-1.5 mb-4">
          {([
            { value: 'unit', label: 'Jednotce' },
            { value: 'activity', label: 'Účelu fondu' },
          ] as const).map(({ value, label }) => (
            <button key={value} type="button" onClick={() => setMode(value)}
              className={`flex items-center gap-1.5 p-2.5 border-2 rounded-lg transition-colors text-xs font-medium ${mode === value ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
            >
              <span className={`w-2.5 h-2.5 rounded-full border-2 flex-shrink-0 ${mode === value ? 'border-brand-500 bg-brand-500' : 'border-slate-400'}`} />
              {label}
            </button>
          ))}
        </div>
      )}

      {effectiveMode === 'activity' ? (
        <ActivityWidget
          activities={activities}
          shopConfig={shopConfig}
          fixedActivity={fixedActivity}
          defaultActivityId={defaultActivity?.id || ''}
          defaultAmount={amountParam}
          title={titleParam}
        />
      ) : (
        <UnitWidget
          units={units}
          shopConfig={shopConfig}
          fixedUnit={fixedUnit}
          defaultUnitId={defaultUnit?.id || ''}
          defaultAmount={amountParam}
          title={titleParam}
        />
      )}
    </WidgetShell>
  );
}
