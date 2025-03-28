'use client'

import type { ReactNode } from 'react'
import styles from './Table.module.css'
import LoadingSpinner from '@/components/loading/LoadingSpinner'
import { Button } from '@radix-ui/themes'

export interface TableColumn<T> {
  header: string
  accessor: keyof T | ((item: T) => ReactNode)
  className?: string
}

export interface TableProps<T> {
  columns: TableColumn<T>[]
  data: T[]
  keyExtractor: (item: T) => string | number
  isLoading?: boolean
  emptyState?: {
    title: string
    message: string
    buttonText?: string
    onButtonClick?: () => void
  }
  className?: string
  onRowClick?: (item: T) => void
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyState,
  className = '',
  onRowClick
}: TableProps<T>) {
  // Render cell content based on accessor type
  const renderCell = (item: T, accessor: TableColumn<T>['accessor']) => {
    if (typeof accessor === 'function') {
      return accessor(item)
    }

    return item[accessor] as ReactNode
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className={`${styles.tableWrapper} ${className}`}>
        <div className={styles.loadingContainer}>
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  // Show empty state
  if (data.length === 0 && emptyState) {
    return (
      <div className={`${styles.tableWrapper} ${className}`}>
        <div className={styles.emptyState}>
          <h3 className={styles.emptyStateTitle}>{emptyState.title}</h3>
          <p className={styles.emptyStateMessage}>{emptyState.message}</p>
          {emptyState.buttonText && emptyState.onButtonClick && (
            <Button className={styles.emptyStateButton} onClick={emptyState.onButtonClick}>
              {emptyState.buttonText}
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`${styles.tableWrapper} ${className}`}>
      <table className={styles.table}>
        <thead>
          <tr className={styles.tableHeader}>
            {columns.map((column, index) => (
              <th key={index} className={`${styles.tableHeaderCell} ${column.className || ''}`}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr
              key={keyExtractor(item)}
              className={styles.tableRow}
              onClick={onRowClick ? () => onRowClick(item) : undefined}
              style={onRowClick ? { cursor: 'pointer' } : undefined}
            >
              {columns.map((column, index) => (
                <td key={index} className={`${styles.tableCell} ${column.className || ''}`}>
                  {renderCell(item, column.accessor)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Table
