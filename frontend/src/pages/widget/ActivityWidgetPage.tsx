import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Activity } from '../../types';
import { ActivityWidget, WidgetShell } from './widgetShared';

export default function ActivityWidgetPage() {
  const [searchParams] = useSearchParams();

  const activityParam = searchParams.get('activity') || '';
  const defaultActivityParam = searchParams.get('default-activity') || '';
  const amountParam = parseFloat(searchParams.get('amount') || '0') || 500;
  const titleParam = searchParams.get('title') || null;

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

  const fixedActivity = activityParam ? activities.find(a => a.code === activityParam) : undefined;
  const defaultActivity = defaultActivityParam ? activities.find(a => a.code === defaultActivityParam) : undefined;

  return (
    <WidgetShell>
      <ActivityWidget
        activities={activities}
        shopConfig={shopConfig}
        fixedActivity={fixedActivity}
        defaultActivityId={defaultActivity?.id || ''}
        defaultAmount={amountParam}
        title={titleParam}
      />
    </WidgetShell>
  );
}
