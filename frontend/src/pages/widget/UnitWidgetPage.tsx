import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { MilitaryUnit } from '../../types';
import { UnitWidget, WidgetShell } from './widgetShared';

export default function UnitWidgetPage() {
  const [searchParams] = useSearchParams();

  const unitParam = searchParams.get('unit') || '';
  const defaultUnitParam = searchParams.get('default-unit') || '';
  const amountParam = parseFloat(searchParams.get('amount') || '0') || 500;
  const titleParam = searchParams.get('title') || null;

  const { data: units = [] } = useQuery<MilitaryUnit[]>({
    queryKey: ['military-units'],
    queryFn: () => api.get<MilitaryUnit[]>('/military-units').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const { data: shopConfig } = useQuery<{ accountNumber: string; iban: string }>({
    queryKey: ['shop-config'],
    queryFn: () => api.get('/config').then(r => r.data),
    staleTime: Infinity,
  });

  const fixedUnit = unitParam ? units.find(u => u.slug === unitParam) : undefined;
  const defaultUnit = defaultUnitParam ? units.find(u => u.slug === defaultUnitParam) : undefined;

  return (
    <WidgetShell>
      <UnitWidget
        units={units}
        shopConfig={shopConfig}
        fixedUnit={fixedUnit}
        defaultUnitId={defaultUnit?.id || ''}
        defaultAmount={amountParam}
        title={titleParam}
      />
    </WidgetShell>
  );
}
