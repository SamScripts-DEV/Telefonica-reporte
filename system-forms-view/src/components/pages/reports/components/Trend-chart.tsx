"use client"

const {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} = require("recharts")

interface TrendChartProps {
  data: Array<{
    period: string
    value: number
    responses?: number
  }>
  height?: number
  showResponses?: boolean
}

export function TrendChart({ data, height = 300, showResponses = true }: TrendChartProps) {
  const formatPeriod = (period: string) => {
    if (period.includes("-")) {
      const [year, month] = period.split("-")
      const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
      return `${monthNames[Number.parseInt(month) - 1]} ${year.slice(-2)}`
    }
    return period
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{formatPeriod(label)}</p>
          <p className="text-blue-600">
            <span className="font-medium">Calificación: </span>
            {payload[0].value.toFixed(2)}
          </p>
          {showResponses && payload[0].payload.responses && (
            <p className="text-gray-600 text-sm">{payload[0].payload.responses} respuestas</p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    
    <ResponsiveContainer width="100%" height={height} >
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="period" tickFormatter={formatPeriod} stroke="#64748b" fontSize={12} />
        <YAxis domain={[1, 5]} stroke="#64748b" fontSize={12} />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#2563eb"
          strokeWidth={3}
          dot={{ fill: "#2563eb", strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: "#2563eb", strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
