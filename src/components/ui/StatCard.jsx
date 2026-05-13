import { cn } from '@/lib/utils';

export default function StatCard({ title, value, subtitle, icon: Icon, iconColor = 'text-primary', iconBg = 'bg-primary/10', trend, className }) {
  return (
    <div className={cn("bg-card rounded-xl border border-border p-5", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
          <p className="text-2xl font-bold text-foreground truncate">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ml-3", iconBg)}>
            <Icon className={cn("w-5 h-5", iconColor)} />
          </div>
        )}
      </div>
      {trend && (
        <div className={cn("mt-3 pt-3 border-t border-border text-xs font-medium", trend.up ? 'text-success' : 'text-destructive')}>
          {trend.label}
        </div>
      )}
    </div>
  );
}