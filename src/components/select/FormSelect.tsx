'use client'
import type { ReactNode } from 'react'
import { Flex, Select } from '@radix-ui/themes'
import styles from './FormSelect.module.css'

export type SelectItem = {
  label: string
  name: string | boolean
  image?: ReactNode | string
  disabled?: boolean
  className?: string
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
  // Add a function to determine the CSS class for each item
  const getItemClass = (item: SelectItem) => {
    if (item.className === 'selectItemDelete') {
      return styles.selectItemDelete
    }
    if (item.name === 'divider') {
      return styles.selectItemDivider
    }
    return styles.selectItem
  }

  // Function to get a valid value for Select.Item
  const getItemValue = (name: string | boolean): string => {
    // If name is an empty string, return a placeholder value
    if (name === '') return 'placeholder'
    return String(name)
  }

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
          onValueChange={(value: string) => {
            // If the value is our placeholder, don't trigger onChange
            if (value === 'placeholder') return
            props.onChange?.(value)
          }}
          disabled={props.disabled}
        >
          <Select.Trigger
            className={props.disabled ? styles.disabledStatusSelect : styles.statusSelect}
            id={props.id}
          />
          <Select.Content
            position="popper"
            sideOffset={5}
            className={styles.selectContent}
            // Add these properties to fix scrolling issues
            avoidCollisions={true}
            sticky="always"
            hideWhenDetached={true}
          >
            <Select.Group>
              {props.items.map((item) => (
                <Select.Item
                  key={String(item.name)}
                  value={getItemValue(item.name)}
                  disabled={item.disabled}
                  className={getItemClass(item)}
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
