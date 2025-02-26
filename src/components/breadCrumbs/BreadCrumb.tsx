import React from 'react'
import { Flex } from '@radix-ui/themes'
import Image from 'next/image'
import Link from 'next/link'
import styles from './BreadCrumb.module.css'

type Item = {
  name: string
  href?: string
}

type Props = {
  items: Item[]
}

export const Breadcrumb = ({ items }: Props) => {
  return (
    <Flex align="center" gap="4" className={styles.breadcrumb}>
      {items.map((item, i) => (
        <Flex key={item.name} align="center" gap="4">
          {i !== 0 && (
            <Image src="/icons/ArrowDown.svg" alt="Arrow Down" width={16} height={16} className={styles.arrowIcon} />
          )}
          {item.href ? (
            <Link href={item.href}>
              <div className={styles.breadCrumbPrev}>{item.name}</div>
            </Link>
          ) : (
            <span className={styles.breadCrumbNext}>{item.name}</span>
          )}
        </Flex>
      ))}
    </Flex>
  )
}
