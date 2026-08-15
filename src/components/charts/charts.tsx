import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const PALETTE = ['#0A6B32', '#0A58CA', '#3D4B63', '#00D166', '#7A5CC9', '#B08A00', '#C94F4F', '#0D9488']

const TOOLTIP_STYLE = {
  backgroundColor: 'hsl(212 63% 12%)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '12px',
  fontSize: '12px',
  color: '#fff',
  boxShadow: '0 8px 24px rgba(11,28,48,0.18)',
}

const EMPTY = (
  <div className="h-52 flex items-center justify-center">
    <p className="text-sm text-on-surface-variant">Aún no hay datos para mostrar.</p>
  </div>
)

export interface ChartDatum {
  name: string
  value: number
}

export function DonutChart({
  data,
  formatter,
  centerLabel,
}: {
  data: ChartDatum[]
  formatter?: (value: number) => string
  centerLabel?: string
}) {
  const visible = data.filter((d) => d.value > 0)
  if (visible.length === 0) return EMPTY
  return (
    <div className="relative h-52">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={visible}
            dataKey="value"
            nameKey="name"
            innerRadius="64%"
            outerRadius="92%"
            paddingAngle={3}
            strokeWidth={0}
          >
            {visible.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => (formatter ? formatter(Number(value)) : String(value))}
            contentStyle={TOOLTIP_STYLE}
            itemStyle={{ padding: 0 }}
          />
        </PieChart>
      </ResponsiveContainer>
      {centerLabel && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="font-display font-bold text-lg text-on-surface text-center px-4 leading-tight">{centerLabel}</p>
        </div>
      )}
    </div>
  )
}

export function MonthlyBars({
  data,
  formatter,
}: {
  data: { month: string; ingresos: number; egresos: number }[]
  formatter?: (value: number) => string
}) {
  if (data.length === 0) return EMPTY
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={3}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(11,28,48,0.08)" vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: '#6B7A90' }}
            interval="preserveStartEnd"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: '#6B7A90' }}
            width={52}
            tickFormatter={(v) => `${Number(v) >= 1000 ? `${(Number(v) / 1000).toFixed(1)}k` : Number(v)}`}
          />
          <Tooltip
            formatter={(value) => (formatter ? formatter(Number(value)) : String(value))}
            contentStyle={TOOLTIP_STYLE}
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" iconSize={8} />
          <Bar dataKey="ingresos" name="Ingresos" fill="#0A6B32" radius={[4, 4, 0, 0]} maxBarSize={26} />
          <Bar dataKey="egresos" name="Egresos" fill="#C94F4F" radius={[4, 4, 0, 0]} maxBarSize={26} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function TopCounterparties({
  data,
  formatter,
}: {
  data: ChartDatum[]
  formatter?: (value: number) => string
}) {
  if (data.length === 0) return EMPTY
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 4, right: 12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(11,28,48,0.08)" horizontal={false} />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: '#6B7A90' }}
            tickFormatter={(v) => `${Number(v) >= 1000 ? `${(Number(v) / 1000).toFixed(1)}k` : Number(v)}`}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={104}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: '#6B7A90' }}
          />
          <Tooltip
            formatter={(value) => (formatter ? formatter(Number(value)) : String(value))}
            contentStyle={TOOLTIP_STYLE}
            cursor={{ fill: 'rgba(11,28,48,0.04)' }}
          />
          <Bar dataKey="value" name="Pendiente" radius={[0, 4, 4, 0]} maxBarSize={18}>
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
