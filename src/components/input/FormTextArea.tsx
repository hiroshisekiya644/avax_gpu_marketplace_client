import React from 'react'
import { Flex, TextArea } from '@radix-ui/themes'
import styles from './FormTextArea.module.css'

type Props = {
  label?: string
  id: string
  placeholder?: string
  error?: string | number | string[]
  name?: string
  defaultValue?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  className?: string
  required?: boolean
  disabled?: boolean
}

export const FormTextArea = (props: Props) => {
  return (
    <Flex direction="column" gap="4" className={styles.formContainer}>
      {props.label && (
        <Flex className={styles.formLabel}>
          <label htmlFor={props.id} className={styles.label}>
            {props.label}
          </label>
          {props.required && <span className={styles.required}>※</span>}
        </Flex>
      )}
      <TextArea
        id={props.id}
        name={props.id}
        placeholder={props.placeholder}
        defaultValue={props.defaultValue}
        value={props.value}
        onChange={props.onChange}
        className={`${props.className} ${styles.textField}`}
        disabled={props.disabled}
        resize="vertical"
      />
      {props.error && <p className={styles.error}>{props.error}</p>}
    </Flex>
  )
}
