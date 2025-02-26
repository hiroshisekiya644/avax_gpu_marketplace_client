'use client'
import { useEffect, useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { formatLargeNumber, formatSmallNumber } from '@/utils/Helper'
import { Card } from '../card/Card'

interface MetricDataPoint {
  step: number
  value: number
  time: number
}

interface MetricChartProps {
  data: MetricDataPoint[]
  metricName: string
  decimalPlaces?: number
}

const PLACEHOLDER_DATA = [
  { step: 0, value: 0, time: 0 },
  { step: 100, value: 0, time: 100 }
]

const MetricChart = ({ data, metricName, decimalPlaces = 1 }: MetricChartProps) => {
  const isPerplexity = metricName.toLowerCase().includes('perplexity')

  const { sortedDataPoints, minStep, maxStep } = useMemo(() => {
    if (data.length === 0) {
      return { sortedDataPoints: PLACEHOLDER_DATA, minStep: 0, maxStep: 0 }
    }

    const sortedDataPoints = data.sort((a, b) => a.step - b.step)
    let minStep = Math.min(...sortedDataPoints.map((point) => point.step))
    const maxStep = Math.max(...sortedDataPoints.map((point) => point.step))

    if (isPerplexity && maxStep > 200) {
      minStep = 200
      const prunedDataPoints = sortedDataPoints.filter((point) => point.step >= 200)
      return { sortedDataPoints: prunedDataPoints, minStep, maxStep }
    }

    return { sortedDataPoints, minStep, maxStep }
  }, [data, isPerplexity])

  const [leftMargin, setLeftMargin] = useState(0)
  const [rightMargin, setRightMargin] = useState(0)
  const [chartHeight, setChartHeight] = useState(190)

  const formatTick = (value: number) => {
    return formatNumber(value, 0)
  }

  const formatNumber = (value: number, decimalPlaces = 1) => {
    if (Math.abs(value) < 1) {
      return formatSmallNumber(value, decimalPlaces)
    }
    if (Math.abs(value) > 1000) {
      return formatLargeNumber(value, decimalPlaces)
    }
    return value.toFixed(decimalPlaces)
  }

  const formatXAxis = (value: number) => {
    return formatLargeNumber(value, 1)
  }

  useEffect(() => {
    const yAxisLabels = sortedDataPoints.map((point) => formatNumber(point.value))
    const flattenedYAxisLabels = yAxisLabels.flat()
    const maxYAxisLabelLength = Math.max(...flattenedYAxisLabels.map((label) => label.length))
    setLeftMargin(40 - maxYAxisLabelLength * 6)

    const xAxisLabels = sortedDataPoints.map((point) => formatXAxis(point.step))
    const maxXAxisLabelLength = Math.max(...xAxisLabels.map((label) => label.length))
    setRightMargin(maxXAxisLabelLength * 4)
  }, [sortedDataPoints])

  useEffect(() => {
    const updateChartHeight = () => {
      const screenHeight = window.innerHeight
      if (screenHeight > 864) {
        const additionalHeight = Math.floor((screenHeight - 864) * 0.2)
        setChartHeight(190 + additionalHeight)
      } else {
        setChartHeight(190)
      }
    }

    updateChartHeight()
    window.addEventListener('resize', updateChartHeight)

    return () => window.removeEventListener('resize', updateChartHeight)
  }, [])

  return (
    <Card
      title={metricName}
      size="compact"
      variant="filled"
      headerRightContent={
        <div className="text-white font-medium text-sm">
          {formatNumber(data[data.length - 1]?.value ?? 0, decimalPlaces)}
        </div>
      }
    >
      <ResponsiveContainer width="100%" height={chartHeight}>
        <LineChart margin={{ left: -leftMargin, right: rightMargin, top: 0, bottom: 0 }}>
          <CartesianGrid stroke="#2F2F2F" />
          <XAxis
            dataKey="step"
            type="number"
            domain={[minStep, maxStep]}
            tickFormatter={formatXAxis}
            tick={{ fontSize: 12, fill: 'white' }}
            axisLine={{ stroke: '#404040' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatTick}
            tick={{ fontSize: 12, fill: 'white' }}
            axisLine={{ stroke: '#404040' }}
            tickLine={false}
            scale={isPerplexity ? 'log' : 'auto'}
            domain={isPerplexity ? ['auto', 'auto'] : undefined}
          />
          <Line
            type="monotone"
            data={sortedDataPoints}
            dataKey="value"
            stroke="#9946FC"
            dot={false}
            strokeWidth={1.8}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}

export default MetricChart
