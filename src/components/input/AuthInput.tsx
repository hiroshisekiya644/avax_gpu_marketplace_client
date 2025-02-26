import React, { ReactNode } from 'react'
import { Flex, TextField } from '@radix-ui/themes'
import styles from './AuthInput.module.css'

type Props = {
  label?: string
  id: string
  type: 'email' | 'password' | 'text' | 'datetime-local' | 'number' | 'date'
  placeholder?: string
  error?: string | number | string[]
  name?: string
  defaultValue?: string | number
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  className?: string
  required?: boolean
  disabled?: boolean
  icon?: ReactNode
}

export const AuthInput = (props: Props) => {
  return (
    <Flex direction="column" gap="0" className={styles.formContainer}>
      {props.label && (
        <Flex className={styles.formLabel}>
          <label htmlFor={props.id} className={styles.label}>
            {props.label}
          </label>
          {props.required && <span className={styles.required}>※</span>}
        </Flex>
      )}
      <TextField.Root
        id={props.id}
        name={props.id}
        type={props.type}
        placeholder={props.placeholder}
        defaultValue={props.defaultValue}
        value={props.value}
        onChange={props.onChange}
        className={`${props.className} ${styles.textField}`}
        disabled={props.disabled}
      ></TextField.Root>
      {props.error && <p className={styles.error}>{props.error}</p>}
    </Flex>
  )
}
