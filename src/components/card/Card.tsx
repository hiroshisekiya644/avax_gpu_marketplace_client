import React, { useMemo, type PropsWithChildren } from 'react'
import clsx from 'clsx'

interface CardProps {
  title?: string
  description?: string
  headerRightContent?: React.ReactNode
  className?: string
  footerContent?: React.ReactNode
  variant?: 'outlined' | 'filled'
  size?: 'default' | 'compact'
}

export function Card({
  title,
  description,
  headerRightContent,
  children,
  className,
  footerContent,
  variant = 'outlined',
  size = 'default'
}: PropsWithChildren<CardProps>) {
  const cardClasses = useMemo(() => {
    let variantClasses = null
    let sizeClasses = null
    switch (variant) {
      case 'outlined':
        variantClasses = [
          'bg-gradient-to-br from-gray-900 to-gray-800 shadow-xl flex flex-col justify-between',
          'border-2 border-gray-500',
          className
        ]
        break
      case 'filled':
        variantClasses = [
          'bg-gradient-to-br from-gray-900 to-gray-800 shadow-xl flex flex-col justify-between',
          'border-none',
          className
        ]
        break
    }

    switch (size) {
      case 'default':
        sizeClasses = ['rounded-lg overflow-hidden']
        break
      case 'compact':
        sizeClasses = ['rounded-sm']
        break
    }

    return clsx(...variantClasses, ...sizeClasses, className)
  }, [variant, size, className])

  const titleClasses = useMemo(() => {
    return clsx(
      'text-white',
      variant === 'filled' ? 'font-medium opacity-60' : 'font-bold',
      size === 'compact' ? 'text-sm' : 'text-xl'
    )
  }, [size, variant])

  const showHeader = title ?? description ?? headerRightContent

  return (
    <div className={cardClasses}>
      <div className={clsx('flex flex-col justify-between h-full', size === 'compact' ? 'p-2 md:p-4' : 'p-2 md:p-6')}>
        {showHeader && (
          <div className="flex flow justify-between items-start mb-4">
            <div className="flex-grow flex flex-row justify-between items-center mb-2 gap-2">
              <div className="flex flex-col justify-start">
                {title && <h3 className={titleClasses}>{title}</h3>}
                {description && <p className="text-sm text-gray-300 line-clamp-2">{description}</p>}
              </div>
              {headerRightContent && <div className="flex-shrink-0">{headerRightContent}</div>}
            </div>
          </div>
        )}
        <div className={footerContent ? 'mb-4' : ''}>{children}</div>
      </div>
      {footerContent && <div className="bg-gray-800 px-6 py-4 mt-auto">{footerContent}</div>}
    </div>
  )
}
