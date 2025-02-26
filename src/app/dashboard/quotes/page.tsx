'use client'
import React, { useState, useEffect } from 'react'
import * as Checkbox from '@radix-ui/react-checkbox'
import { CheckIcon, ChevronUpIcon, ChevronDownIcon, ArrowRightIcon } from '@radix-ui/react-icons'
import * as Progress from '@radix-ui/react-progress'
import { Flex, Button } from '@radix-ui/themes'
import { useResize } from '@/utils/Helper'
import styles from './page.module.css'

const options = [
  { id: 'A', label: 'Nvidia H100s' },
  { id: 'B', label: 'Nvidia A100s' },
  { id: 'C', label: 'Nvidia B100s' },
  { id: 'D', label: 'Nvidia GH200s' },
  { id: 'E', label: 'Nvidia 3090/4090s' },
  { id: 'F', label: 'AMD MI300X' },
  { id: 'G', label: 'Other' }
]

const rentOptions = [
  { id: 'A', label: 'ASAP' },
  { id: 'B', label: 'Next 7 days' },
  { id: 'C', label: 'Next 14 days' },
  { id: 'D', label: 'In 1 month' },
  { id: 'E', label: 'In 2 months' },
  { id: 'F', label: 'In 3 months' },
  { id: 'G', label: 'Next 3-12 months' }
]

const ReservedInstances = () => {
  const { isResponsive } = useResize()
  const [currentStage, setCurrentStage] = useState<number>(1)
  const [progress, setProgress] = useState<number>(14)
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [selectedRentOptions, setSelectedRentOptions] = useState<string[]>([])
  const [customInput, setCustomInput] = useState('')

  const handleToggle = (id: string) => {
    setSelectedOptions((prev) => (prev.includes(id) ? prev.filter((option) => option !== id) : [...prev, id]))
  }

  const handleRentToggle = (id: string) => {
    setSelectedRentOptions((prev) => (prev.includes(id) ? prev.filter((option) => option !== id) : [...prev, id]))
  }

  const handleNextStage = () => {
    setCurrentStage(currentStage + 1)
  }

  const handlePreviousStage = () => {
    setCurrentStage(currentStage - 1)
  }

  useEffect(() => {
    const timer = setTimeout(() => setProgress(14.28 * currentStage), 500)
    return () => clearTimeout(timer)
  }, [currentStage])

  return (
    <Flex className={styles.bg} direction="column">
      <Flex p="4" justify="center" direction="column" gap="2">
        <Progress.Root className={styles.progressRoot} value={progress}>
          <Progress.Indicator className={styles.progressIndicator} style={{ width: `${progress}%` }} />
        </Progress.Root>
        <form
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleNextStage()
            }
          }}
        >
          {currentStage == 1 && (
            <Flex direction="column" gap="4" justify="center" align="center" mt="6">
              <Flex className={styles.headerTitle} align="center" gap="2">
                1
                <ArrowRightIcon /> Your E-Mail *
              </Flex>
              <Flex className={styles.subTitle}>Required</Flex>
              <Flex>
                <div className={styles.textFieldContainer}>
                  <input id="emailAddress" type="text" placeholder="name@example.com" className={styles.textField} />
                </div>
              </Flex>
              <Flex gap="4" align="center">
                <Button className={styles.submitButton} onClick={handleNextStage}>
                  OK
                </Button>
                <Flex className={styles.subTitle}>
                  <span>Press Enter </span> &#8629;
                </Flex>
              </Flex>
            </Flex>
          )}

          {currentStage == 2 && (
            <Flex direction="column" gap="4" justify="center" align="center" mt="6">
              <Flex className={styles.headerTitle} align="center" gap="2">
                2 <ArrowRightIcon /> Which GPUs are you interested in *
              </Flex>
              <Flex className={styles.subTitle}>Required</Flex>
              <Flex>Choose as many you like</Flex>
              <Flex direction="column" gap="10px">
                {options.map((option) =>
                  option.id !== 'G' ? (
                    <label key={option.id} className={styles.label}>
                      <Flex justify="between" width="100%" align="center">
                        <Flex gap="4" align="center">
                          <div
                            className={selectedOptions.includes(option.id) ? styles.optionIdChecked : styles.optionId}
                          >
                            {option.id}
                          </div>
                          <span>{option.label}</span>
                        </Flex>
                        <Checkbox.Root
                          id={option.id}
                          checked={selectedOptions.includes(option.id)}
                          onCheckedChange={() => handleToggle(option.id)}
                          className={`${styles.checkboxRoot} ${
                            selectedOptions.includes(option.id)
                              ? styles.checkboxRootSelected
                              : styles.checkboxRootUnselected
                          }`}
                        >
                          <Checkbox.Indicator>
                            <CheckIcon />
                          </Checkbox.Indicator>
                        </Checkbox.Root>
                      </Flex>
                    </label>
                  ) : (
                    <label key={option.id} className={styles.label}>
                      <Flex justify="between" width="100%" align="center">
                        <Flex gap="4" align="center">
                          <div
                            className={selectedOptions.includes(option.id) ? styles.optionIdChecked : styles.optionId}
                          >
                            {option.id}
                          </div>
                          <input
                            type="text"
                            value={customInput}
                            onChange={(e) => setCustomInput(e.target.value)}
                            placeholder="Other"
                            className={styles.checkboxInput}
                          />
                        </Flex>
                        <Checkbox.Root
                          id={option.id}
                          checked={selectedOptions.includes(option.id)}
                          onCheckedChange={() => handleToggle(option.id)}
                          className={`${styles.checkboxRoot} ${
                            selectedOptions.includes(option.id)
                              ? styles.checkboxRootSelected
                              : styles.checkboxRootUnselected
                          }`}
                        >
                          <Checkbox.Indicator>
                            <CheckIcon />
                          </Checkbox.Indicator>
                        </Checkbox.Root>
                      </Flex>
                    </label>
                  )
                )}
              </Flex>
              <Flex gap="4" align="center">
                <Button className={styles.submitButton} onClick={handleNextStage}>
                  OK
                </Button>
                <Flex className={styles.subTitle}>
                  <span>Press Enter </span> &#8629;
                </Flex>
              </Flex>
              <Flex ml="auto" mt="4">
                <Button className={styles.iconButton} onClick={handleNextStage}>
                  <ChevronDownIcon />
                </Button>
                <Button className={styles.iconButton} onClick={handlePreviousStage}>
                  <ChevronUpIcon />
                </Button>
              </Flex>
            </Flex>
          )}

          {currentStage == 3 && (
            <Flex direction="column" gap="4" justify="center" align="center" mt="6">
              <Flex className={styles.headerTitle} align="center" gap="2">
                3 <ArrowRightIcon /> How many GPUs are you looking for? *
              </Flex>
              <Flex className={styles.subTitle}>Required</Flex>
              <Flex>
                <div className={styles.textFieldContainer}>
                  <input id="gpuType" type="text" placeholder="Type your answer here..." className={styles.textField} />
                </div>
              </Flex>
              <Flex gap="4" align="center">
                <Button className={styles.submitButton} onClick={handleNextStage}>
                  OK
                </Button>
                <Flex className={styles.subTitle}>
                  <span>Press Enter </span> &#8629;
                </Flex>
              </Flex>
              <Flex ml="auto" mt="4">
                <Button className={styles.iconButton} onClick={handleNextStage}>
                  <ChevronDownIcon />
                </Button>
                <Button className={styles.iconButton} onClick={handlePreviousStage}>
                  <ChevronUpIcon />
                </Button>
              </Flex>
            </Flex>
          )}

          {currentStage == 4 && (
            <Flex direction="column" gap="4" justify="center" align="center" mt="6">
              <Flex className={styles.headerTitle} align="center" gap="2">
                4
                <ArrowRightIcon /> For how long do you want to rent them? *
              </Flex>
              <Flex className={styles.subTitle}>Required</Flex>
              <Flex>
                <div className={styles.textFieldContainer}>
                  <input
                    id="rentDuration"
                    type="text"
                    placeholder="Type your answer here..."
                    className={styles.textField}
                  />
                </div>
              </Flex>
              <Flex gap="4" align="center">
                <Button className={styles.submitButton} onClick={handleNextStage}>
                  OK
                </Button>
                <Flex className={styles.subTitle}>
                  <span>Press Enter </span> &#8629;
                </Flex>
              </Flex>
              <Flex ml="auto" mt="4">
                <Button className={styles.iconButton} onClick={handleNextStage}>
                  <ChevronDownIcon />
                </Button>
                <Button className={styles.iconButton} onClick={handlePreviousStage}>
                  <ChevronUpIcon />
                </Button>
              </Flex>
            </Flex>
          )}

          {currentStage == 5 && (
            <Flex direction="column" gap="4" justify="center" align="center" mt="6">
              <Flex className={styles.headerTitle} align="center" gap="2">
                5 <ArrowRightIcon /> When do you want to have the cluster *
              </Flex>
              <Flex className={styles.subTitle}>Required</Flex>
              <Flex>Choose as many you like</Flex>
              <Flex direction="column" gap="10px">
                {rentOptions.map((option) => (
                  <label key={option.id} className={styles.label}>
                    <Flex justify="between" width="100%" align="center">
                      <Flex gap="4" align="center">
                        <div
                          className={selectedRentOptions.includes(option.id) ? styles.optionIdChecked : styles.optionId}
                        >
                          {option.id}
                        </div>
                        <span>{option.label}</span>
                      </Flex>
                      <Checkbox.Root
                        id={option.id}
                        checked={selectedRentOptions.includes(option.id)}
                        onCheckedChange={() => handleRentToggle(option.id)}
                        className={`${styles.checkboxRoot} ${
                          selectedRentOptions.includes(option.id)
                            ? styles.checkboxRootSelected
                            : styles.checkboxRootUnselected
                        }`}
                      >
                        <Checkbox.Indicator>
                          <CheckIcon />
                        </Checkbox.Indicator>
                      </Checkbox.Root>
                    </Flex>
                  </label>
                ))}
              </Flex>
              <Flex gap="4" align="center">
                <Button className={styles.submitButton} onClick={handleNextStage}>
                  OK
                </Button>
              </Flex>
              <Flex ml="auto" mt="4">
                <Button className={styles.iconButton} onClick={handleNextStage}>
                  <ChevronDownIcon />
                </Button>
                <Button className={styles.iconButton} onClick={handlePreviousStage}>
                  <ChevronUpIcon />
                </Button>
              </Flex>
            </Flex>
          )}

          {currentStage == 6 && (
            <Flex direction="column" gap="4" justify="center" align="center" mt="6">
              <Flex className={styles.headerTitle} align="center" gap="2">
                6
                <ArrowRightIcon /> Any other requirements (budget, location etc?) *
              </Flex>
              <Flex className={styles.subTitle}>Required</Flex>
              <Flex>
                <div className={styles.textFieldContainer}>
                  <input
                    id="rentDuration"
                    type="text"
                    placeholder="Type your answer here..."
                    className={styles.textField}
                  />
                </div>
              </Flex>
              <Flex gap="4" align="center">
                <Button className={styles.submitButton} onClick={handleNextStage}>
                  Submit
                </Button>
                <Flex className={styles.subTitle}>
                  <span>Press Enter </span> &#8629;
                </Flex>
              </Flex>
              <Flex ml="auto" mt="4">
                <Button className={styles.iconButton} onClick={handleNextStage}>
                  <ChevronDownIcon />
                </Button>
                <Button className={styles.iconButton} onClick={handlePreviousStage}>
                  <ChevronUpIcon />
                </Button>
              </Flex>
            </Flex>
          )}

          {currentStage == 7 && (
            <Flex direction="column" gap="4" justify="center" align="center" mt="6">
              <Flex
                className={styles.headerTitle}
                width={isResponsive ? '90%' : '50%'}
                mt="20%"
                align="center"
                direction="column"
                justify="center"
                style={{ textAlign: 'center' }}
              >
                <Flex>Thank you for your GPU reserved instance request.</Flex>
                <Flex>We &apos;ll review your submission and be in touch soon.</Flex>
              </Flex>
            </Flex>
          )}
        </form>
      </Flex>
    </Flex>
  )
}

export default ReservedInstances
