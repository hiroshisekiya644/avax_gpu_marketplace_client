'use client'
import React, { ReactNode } from 'react'
import { Flex, Select } from '@radix-ui/themes'
import styles from './FormSelect.module.css'

export type SelectItem = {
  label: string
  name: string | boolean
  image?: ReactNode | string
  disabled?: boolean
}

type Props = {
  id?: string
  name?: string
  items: SelectItem[]
  error?: string | boolean | number
  onChange?: (value: string) => void
  defaultValue?: string | number
  value?: string
  className?: string
  required?: boolean
  label?: string
  disabled?: boolean
}

export const FormSelect = (props: Props) => {
  return (
    <div className={props.className}>
      <Flex direction="column" gap="2">
        {props.label && (
          <Flex>
            <label htmlFor={props.id} className={styles.label}>
              {props.label}
            </label>
            {props.required && <span className={styles.required}>※</span>}
          </Flex>
        )}
        <Select.Root
          name={props.name}
          defaultValue={props.defaultValue ? String(props.defaultValue) : undefined}
          value={props.value}
          onValueChange={(value) => props.onChange?.(value)}
          disabled={props.disabled}
        >
          <Select.Trigger
            className={props.disabled ? styles.disabledStatusSelect : styles.statusSelect}
            id={props.id}
          />
          <Select.Content position="popper" sideOffset={5} className={styles.selectContent}>
            <Select.Group>
              {props.items.map((item) => (
                <Select.Item
                  key={String(item.name)}
                  value={String(item.name)}
                  disabled={item.disabled}
                  className={styles.selectItem}
                >
                  <Flex>
                    <span className="mr-2">{item.image}</span>
                    <span className={item.disabled ? styles.disabledLabel : styles.selectLabel}>{item.label}</span>
                  </Flex>
                </Select.Item>
              ))}
            </Select.Group>
          </Select.Content>
          {props.error && <p className={styles.error}>{props.error}</p>}
        </Select.Root>
      </Flex>
    </div>
  )
}
