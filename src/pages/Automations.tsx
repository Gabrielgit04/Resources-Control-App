import { Icon } from '@/components/Icon'
import { EmptyState } from '@/components/EmptyState'

const AUTOMATIONS: { name: string; description: string; icon: string; active: boolean }[] = []

export function Automations() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-on-surface mb-2">Automatizaciones</h2>
          <p className="text-on-surface-variant text-sm md:text-base">Reglas que mantienen tus finanzas en piloto automático.</p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-on-primary font-medium text-sm glow-hover transition-all">
          <Icon name="add" size={18} />
          Nueva automatización
        </button>
      </div>

      {/* Automations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {AUTOMATIONS.length === 0 ? (
          <div className="md:col-span-3 bg-surface-container-lowest rounded-xl p-6 ghost-border">
            <EmptyState
              icon="auto_awesome"
              title="Aún no tienes automatizaciones"
              description="Crea reglas para que tus finanzas trabajen solas."
            />
          </div>
        ) : (
          AUTOMATIONS.map((auto) => (
            <div
              key={auto.name}
              className="bg-surface-container-lowest rounded-xl p-6 ghost-border shadow-[0_8px_32px_rgba(11,28,48,0.03)] hover:bg-surface-bright transition-colors"
            >
              <div className="flex items-start justify-between mb-5">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-container/20 text-primary">
                  <Icon name={auto.icon} />
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                    auto.active ? 'bg-primary/10 text-primary' : 'bg-surface-container text-on-surface-variant'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${auto.active ? 'bg-primary' : 'bg-on-surface-variant'}`} />
                  {auto.active ? 'Activo' : 'Pausado'}
                </span>
              </div>
              <h3 className="font-display font-semibold text-lg text-on-surface mb-1">{auto.name}</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">{auto.description}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
