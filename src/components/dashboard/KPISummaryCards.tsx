import { AlertTriangle, Calendar } from 'lucide-react';
import { getStructuralProblems, getInterventions } from '@/data/mockData';
interface KPISummaryCardsProps {
  onNavigateToSection: (section: 'operational' | 'interventions') => void;
}
export function KPISummaryCards({
  onNavigateToSection
}: KPISummaryCardsProps) {
  const problemsCount = getStructuralProblems().length;
  const interventionsCount = getInterventions().length;
  return <div className="grid gap-3 grid-rows-2 h-full">
      <button onClick={() => onNavigateToSection('operational')} className="rounded-lg border-l-4 border-l-primary bg-card p-3 text-left hover:shadow-md transition-all group">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
              Dashboard operacional
            </p>
            <p className="text-xl font-bold text-primary mt-1">{problemsCount}</p>
          </div>
          <AlertTriangle className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </button>

      <button onClick={() => onNavigateToSection('interventions')} className="rounded-lg border-l-4 border-l-primary bg-card p-3 text-left hover:shadow-md transition-all group">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
              Intervenções programadas
            </p>
            <p className="text-xl font-bold text-primary mt-1">{interventionsCount}</p>
          </div>
          <Calendar className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </button>
    </div>;
}