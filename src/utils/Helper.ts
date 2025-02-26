import { useState, useEffect } from 'react'

export const useResize = () => {
  const [screenSize, setScreenSize] = useState({
    width: 0,
    height: 0,
    isMobile: false,
    isResponsive: false
  })

  const updateSize = () => {
    setScreenSize({
      width: window.innerWidth,
      height: window.innerHeight,
      isMobile: window.innerWidth < 768,
      isResponsive: window.innerWidth < 1024
    })
  }

  useEffect(() => {
    window.addEventListener('resize', updateSize)
    updateSize()

    return () => {
      window.removeEventListener('resize', updateSize)
    }
  }, [])

  return screenSize
}

export const formatLargeNumber = (num: number, decimalPlaces = 1): string => {
  const units = ['', 'K', 'M', 'B', 'T']
  const unitIndex = Math.floor(Math.log10(Math.abs(num)) / 3)
  const value = num / Math.pow(1000, unitIndex)
  const formattedValue = value.toFixed(decimalPlaces).replace(/\.0+$/, '')
  return `${formattedValue}${units[unitIndex]}`
}

export const formatSmallNumber = (num: number, decimalPlaces = 2): string => {
  if (num === 0) return '0'
  const absNum = Math.abs(num)
  if (absNum >= 1e-3) return num.toFixed(decimalPlaces)
  const exponent = Math.floor(Math.log10(absNum))
  const mantissa = num / Math.pow(10, exponent)
  return `${parseFloat(mantissa.toFixed(decimalPlaces))}e${exponent}`
}
