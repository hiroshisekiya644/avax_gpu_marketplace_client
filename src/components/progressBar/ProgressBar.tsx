'use client'

import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { formatLargeNumber } from '@/utils/Helper'

interface ProgressBarCardProps {
  title: string
  current?: number
  total?: bigint
  unit: string
}

const formatNumber = (num: number) => {
  return num.toLocaleString('en-US')
}

export default function ProgressBarCard({ title, current, total, unit }: ProgressBarCardProps) {
  const progress =
    total && total > BigInt(0) ? Math.min(Number((BigInt(current ?? 0) * BigInt(10000)) / total) / 100, 100) : null
  const isCompleted = progress && progress >= 100
  const blockSpacing = 2.5
  const targetBlockWidth = 5
  const [totalBlocks, setTotalBlocks] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const calculateBlocks = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth
        const calculatedBlocks = Math.floor(containerWidth / (targetBlockWidth + blockSpacing))
        setTotalBlocks(calculatedBlocks)
      }
    }

    calculateBlocks()
    const resizeObserver = new ResizeObserver(calculateBlocks)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }
    return () => resizeObserver.disconnect()
  }, [])
  const filledBlocks = Math.floor(((progress ?? 0) / 100) * totalBlocks)
  const progressPercentage = progress !== null ? `${progress.toFixed(2)}%` : '-'

  return (
    <div>
      <h2 className="text-white text-base font-medium">{title}</h2>
      <div className="relative pt-2 pb-2">
        <div className="flex justify-between mb-2 gap-2">
          <span className="text-white text-2xl font-500 tracking-tighter pb-1" style={{ letterSpacing: '-0.24px' }}>
            {progressPercentage}
          </span>
          <span className="text-white text-lg font-500 opacity-50">
            {current ? formatNumber(Math.min(Number(current), Number(total ?? 0))) : '-'} /{' '}
            {total && total > BigInt(0) ? formatLargeNumber(Number(total)) : '-'} {unit}
          </span>
        </div>
        <div className="h-5 flex" ref={containerRef}>
          {Array.from({ length: totalBlocks }).map((_, index) => (
            <div
              key={index}
              className={clsx(
                'h-full flex-grow rounded-px transition-all duration-300',
                index < filledBlocks ? (isCompleted ? 'bg-[#17B760]' : 'bg-[#A562F6]') : 'bg-[#2D2D2D]',
                index === filledBlocks && 'bg-gradient-to-r from-[#A562F6] to-[#8040C0] animate-pulse'
              )}
              style={{
                marginRight: index === totalBlocks - 1 ? 0 : blockSpacing,
                animationDuration: '2.5s',
                animationIterationCount: 'infinite',
                animationTimingFunction: 'ease-in-out'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
