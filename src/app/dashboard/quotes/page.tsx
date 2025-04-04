'use client'
import { useState, useEffect, useRef } from 'react'
import type React from 'react'

import { CheckIcon, ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons'
import { Flex } from '@radix-ui/themes'
import { useRouter } from 'next/navigation'
import { Snackbar } from '@/components/snackbar/SnackBar'
import styles from './page.module.css'

// Define the form data structure
interface FormData {
  email: string
  gpuTypes: string[]
  customGpuType: string
  gpuCount: string
  rentDuration: string[] // Changed from string to string[]
  rentTiming: string[]
  otherRequirements: string
}

// Define the options for GPU types
const gpuOptions = [
  { id: 'A', label: 'Nvidia H100s' },
  { id: 'B', label: 'Nvidia A100s' },
  { id: 'C', label: 'Nvidia B100s' },
  { id: 'D', label: 'Nvidia GH200s' },
  { id: 'E', label: 'Nvidia 3090/4090s' },
  { id: 'F', label: 'AMD MI300X' },
  { id: 'G', label: 'Other' }
]

// Define the options for rent timing
const rentTimingOptions = [
  { id: 'A', label: 'ASAP' },
  { id: 'B', label: 'Next 7 days' },
  { id: 'C', label: 'Next 14 days' },
  { id: 'D', label: 'In 1 month' },
  { id: 'E', label: 'In 2 months' },
  { id: 'F', label: 'In 3 months' },
  { id: 'G', label: 'Next 3-12 months' }
]

// Add rental duration options after the rentTimingOptions
const rentDurationOptions = [
  { id: 'A', label: '1-2 weeks' },
  { id: 'B', label: '1 month' },
  { id: 'C', label: '3 months' },
  { id: 'D', label: '6 months' },
  { id: 'E', label: '1 year' },
  { id: 'F', label: 'More than 1 year' }
]

// Define the steps
const formSteps = [
  { id: 1, title: 'Contact', description: 'Your email address' },
  { id: 2, title: 'GPU Types', description: 'Select GPU types you need' },
  { id: 3, title: 'Quantity', description: 'How many GPUs' },
  { id: 4, title: 'Duration', description: 'Rental period' },
  { id: 5, title: 'Timing', description: 'When you need them' },
  { id: 6, title: 'Requirements', description: 'Additional details' },
  { id: 7, title: 'Review', description: 'Confirm your request' }
]

const ReservedInstances = () => {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [animationReady, setAnimationReady] = useState<boolean>(false)

  // Create refs for input focus
  const inputRefs = {
    email: useRef<HTMLInputElement>(null),
    gpuCount: useRef<HTMLInputElement>(null),
    rentDuration: useRef<HTMLInputElement>(null),
    otherRequirements: useRef<HTMLInputElement>(null),
    customGpuType: useRef<HTMLInputElement>(null)
  }

  // Initialize form data
  const [formData, setFormData] = useState<FormData>({
    email: '',
    gpuTypes: [],
    customGpuType: '',
    gpuCount: '',
    rentDuration: [], // Changed from '' to []
    rentTiming: [],
    otherRequirements: ''
  })

  // Set animation ready after a short delay for a smoother entry
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationReady(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // Focus the input field when the step changes
  useEffect(() => {
    const focusInput = () => {
      switch (currentStep) {
        case 1:
          inputRefs.email.current?.focus()
          break
        case 3:
          inputRefs.gpuCount.current?.focus()
          break
        case 4:
          inputRefs.rentDuration.current?.focus()
          break
        case 6:
          inputRefs.otherRequirements.current?.focus()
          break
        default:
          break
      }
    }

    // Small delay to ensure the DOM is ready
    const timer = setTimeout(focusInput, 100)
    return () => clearTimeout(timer)
  }, [currentStep])

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error when user types
    if (formErrors[name as keyof FormData]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  // Handle checkbox changes for GPU types
  const handleGpuTypeToggle = (id: string) => {
    setFormData((prev) => {
      const newGpuTypes = prev.gpuTypes.includes(id)
        ? prev.gpuTypes.filter((type) => type !== id)
        : [...prev.gpuTypes, id]

      return { ...prev, gpuTypes: newGpuTypes }
    })

    // Clear error when user selects
    if (formErrors.gpuTypes) {
      setFormErrors((prev) => ({ ...prev, gpuTypes: '' }))
    }
  }

  // Handle checkbox changes for rent timing
  const handleRentTimingToggle = (id: string) => {
    setFormData((prev) => {
      const newRentTiming = prev.rentTiming.includes(id)
        ? prev.rentTiming.filter((timing) => timing !== id)
        : [...prev.rentTiming, id]

      return { ...prev, rentTiming: newRentTiming }
    })

    // Clear error when user selects
    if (formErrors.rentTiming) {
      setFormErrors((prev) => ({ ...prev, rentTiming: '' }))
    }
  }

  // Add a handler for rent duration toggle after the handleRentTimingToggle function
  const handleRentDurationToggle = (id: string) => {
    setFormData((prev) => {
      const newRentDuration = prev.rentDuration.includes(id)
        ? prev.rentDuration.filter((duration) => duration !== id)
        : [...prev.rentDuration, id]

      return { ...prev, rentDuration: newRentDuration }
    })

    // Clear error when user selects
    if (formErrors.rentDuration) {
      setFormErrors((prev) => ({ ...prev, rentDuration: '' }))
    }
  }

  // Validate the current step
  const validateStep = (): boolean => {
    const errors: Partial<Record<keyof FormData, string>> = {}

    switch (currentStep) {
      case 1:
        if (!formData.email) {
          errors.email = 'Email is required'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          errors.email = 'Please enter a valid email address'
        }
        break
      case 2:
        if (formData.gpuTypes.length === 0) {
          errors.gpuTypes = 'Please select at least one GPU type'
        }
        if (formData.gpuTypes.includes('G') && !formData.customGpuType) {
          errors.customGpuType = 'Please specify the other GPU type'
        }
        break
      case 3:
        if (!formData.gpuCount) {
          errors.gpuCount = 'Please specify how many GPUs you need'
        }
        break
      case 4:
        if (formData.rentDuration.length === 0) {
          errors.rentDuration = 'Please select at least one rental duration option'
        }
        break
      case 5:
        if (formData.rentTiming.length === 0) {
          errors.rentTiming = 'Please select at least one timing option'
        }
        break
      case 6:
        // Optional field, no validation needed
        break
      default:
        break
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle next button click
  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < formSteps.length) {
        setCurrentStep(currentStep + 1)
      }
    }
  }

  // Handle previous button click
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Handle form submission
  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Show success message
      Snackbar({ message: 'Your GPU reservation request has been submitted successfully!' })

      // Reset form and go to success step
      setCurrentStep(8)
    } catch (error) {
      Snackbar({
        message: 'There was an error submitting your request. Please try again.',
        type: 'error'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleNext()
    }
  }

  // Calculate progress percentage
  const progressPercentage = ((currentStep - 1) / (formSteps.length - 1)) * 100

  // Render progress steps
  const renderProgressSteps = () => {
    return (
      <div className={styles.progressContainer}>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progressPercentage}%` }}></div>
        </div>
        <div className={styles.progressSteps}>
          {formSteps.map((step) => (
            <div
              key={step.id}
              className={`${styles.progressStep} ${
                currentStep === step.id ? styles.active : ''
              } ${currentStep > step.id ? styles.completed : ''}`}
            >
              {currentStep > step.id ? <CheckIcon /> : step.id}
              <div className={styles.progressStepLabel}>{step.title}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Render the current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className={styles.formStep}>
            <div className={styles.stepTitle}>
              <div className={styles.stepNumber}>1</div>
              Your Email Address <span className={styles.required}>*</span>
            </div>
            <div className={styles.stepDescription}>
              We'll use this to contact you about your GPU reservation request.
            </div>
            <div className={styles.inputContainer}>
              <input
                ref={inputRefs.email}
                type="email"
                name="email"
                className={styles.textField}
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
              />
              {formErrors.email && <div className={styles.errorMessage}>{formErrors.email}</div>}
            </div>
          </div>
        )

      case 2:
        return (
          <div className={styles.formStep}>
            <div className={styles.stepTitle}>
              <div className={styles.stepNumber}>2</div>
              Which GPUs are you interested in? <span className={styles.required}>*</span>
            </div>
            <div className={styles.stepDescription}>Select all GPU types that would meet your requirements.</div>
            <div className={styles.optionsContainer}>
              {gpuOptions.map((option) => (
                <div
                  key={option.id}
                  className={`${styles.optionItem} ${formData.gpuTypes.includes(option.id) ? styles.selected : ''}`}
                  onClick={() => handleGpuTypeToggle(option.id)}
                >
                  <div className={styles.optionId}>{option.id}</div>
                  <div className={styles.optionLabel}>{option.label}</div>
                  {option.id === 'G' && formData.gpuTypes.includes('G') && (
                    <input
                      ref={inputRefs.customGpuType}
                      type="text"
                      className={styles.customInput}
                      placeholder="Please specify"
                      value={formData.customGpuType}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          customGpuType: e.target.value
                        }))
                      }
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                  <div className={styles.optionCheckbox}>
                    <CheckIcon className={styles.checkIcon} />
                  </div>
                </div>
              ))}
              {formErrors.gpuTypes && <div className={styles.errorMessage}>{formErrors.gpuTypes}</div>}
              {formErrors.customGpuType && <div className={styles.errorMessage}>{formErrors.customGpuType}</div>}
            </div>
          </div>
        )

      case 3:
        return (
          <div className={styles.formStep}>
            <div className={styles.stepTitle}>
              <div className={styles.stepNumber}>3</div>
              How many GPUs do you need? <span className={styles.required}>*</span>
            </div>
            <div className={styles.stepDescription}>Specify the number of GPUs you're looking to reserve.</div>
            <div className={styles.inputContainer}>
              <input
                ref={inputRefs.gpuCount}
                type="text"
                name="gpuCount"
                className={styles.textField}
                placeholder="e.g., 4, 8, 16, etc."
                value={formData.gpuCount}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
              />
              {formErrors.gpuCount && <div className={styles.errorMessage}>{formErrors.gpuCount}</div>}
            </div>
          </div>
        )

      case 4:
        return (
          <div className={styles.formStep}>
            <div className={styles.stepTitle}>
              <div className={styles.stepNumber}>4</div>
              How long do you want to rent them? <span className={styles.required}>*</span>
            </div>
            <div className={styles.stepDescription}>Select all rental durations that would work for your needs.</div>
            <div className={styles.optionsContainer}>
              {rentDurationOptions.map((option) => (
                <div
                  key={option.id}
                  className={`${styles.optionItem} ${formData.rentDuration.includes(option.id) ? styles.selected : ''}`}
                  onClick={() => handleRentDurationToggle(option.id)}
                >
                  <div className={styles.optionId}>{option.id}</div>
                  <div className={styles.optionLabel}>{option.label}</div>
                  <div className={styles.optionCheckbox}>
                    <CheckIcon className={styles.checkIcon} />
                  </div>
                </div>
              ))}
              {formErrors.rentDuration && <div className={styles.errorMessage}>{formErrors.rentDuration}</div>}
            </div>
          </div>
        )

      case 5:
        return (
          <div className={styles.formStep}>
            <div className={styles.stepTitle}>
              <div className={styles.stepNumber}>5</div>
              When do you want to have the GPUs? <span className={styles.required}>*</span>
            </div>
            <div className={styles.stepDescription}>Select all timeframes that would work for your needs.</div>
            <div className={styles.optionsContainer}>
              {rentTimingOptions.map((option) => (
                <div
                  key={option.id}
                  className={`${styles.optionItem} ${formData.rentTiming.includes(option.id) ? styles.selected : ''}`}
                  onClick={() => handleRentTimingToggle(option.id)}
                >
                  <div className={styles.optionId}>{option.id}</div>
                  <div className={styles.optionLabel}>{option.label}</div>
                  <div className={styles.optionCheckbox}>
                    <CheckIcon className={styles.checkIcon} />
                  </div>
                </div>
              ))}
              {formErrors.rentTiming && <div className={styles.errorMessage}>{formErrors.rentTiming}</div>}
            </div>
          </div>
        )

      case 6:
        return (
          <div className={styles.formStep}>
            <div className={styles.stepTitle}>
              <div className={styles.stepNumber}>6</div>
              Any other requirements?
            </div>
            <div className={styles.stepDescription}>
              Please specify any additional requirements such as budget constraints, location preferences, etc.
            </div>
            <div className={styles.inputContainer}>
              <input
                ref={inputRefs.otherRequirements}
                type="text"
                name="otherRequirements"
                className={styles.textField}
                placeholder="Type your requirements here..."
                value={formData.otherRequirements}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>
        )

      case 7:
        return (
          <div className={styles.formStep}>
            <div className={styles.stepTitle}>
              <div className={styles.stepNumber}>7</div>
              Review Your Request
            </div>
            <div className={styles.stepDescription}>Please review your GPU reservation request before submitting.</div>
            <div className={styles.summaryContainer}>
              <div className={styles.summaryTitle}>Request Summary</div>

              <div className={styles.summaryItem}>
                <div className={styles.summaryLabel}>Email Address:</div>
                <div className={styles.summaryValue}>{formData.email}</div>
              </div>

              <div className={styles.summaryItem}>
                <div className={styles.summaryLabel}>GPU Types:</div>
                <div className={styles.summaryValue}>
                  <div className={styles.summaryList}>
                    {formData.gpuTypes.map((typeId) => {
                      const option = gpuOptions.find((opt) => opt.id === typeId)
                      return (
                        <div key={typeId} className={styles.summaryTag}>
                          {typeId === 'G' ? formData.customGpuType : option?.label}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className={styles.summaryItem}>
                <div className={styles.summaryLabel}>Number of GPUs:</div>
                <div className={styles.summaryValue}>{formData.gpuCount}</div>
              </div>

              <div className={styles.summaryItem}>
                <div className={styles.summaryLabel}>Rental Duration:</div>
                <div className={styles.summaryValue}>
                  <div className={styles.summaryList}>
                    {formData.rentDuration.map((durationId) => {
                      const option = rentDurationOptions.find((opt) => opt.id === durationId)
                      return (
                        <div key={durationId} className={styles.summaryTag}>
                          {option?.label}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className={styles.summaryItem}>
                <div className={styles.summaryLabel}>Preferred Timing:</div>
                <div className={styles.summaryValue}>
                  <div className={styles.summaryList}>
                    {formData.rentTiming.map((timingId) => {
                      const option = rentTimingOptions.find((opt) => opt.id === timingId)
                      return (
                        <div key={timingId} className={styles.summaryTag}>
                          {option?.label}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {formData.otherRequirements && (
                <div className={styles.summaryItem}>
                  <div className={styles.summaryLabel}>Additional Requirements:</div>
                  <div className={styles.summaryValue}>{formData.otherRequirements}</div>
                </div>
              )}
            </div>
          </div>
        )

      case 8:
        return (
          <div className={styles.successContainer}>
            <div className={styles.successIcon}>✓</div>
            <div className={styles.successTitle}>Thank You!</div>
            <div className={styles.successMessage}>
              Your GPU reservation request has been submitted successfully. We'll review your submission and be in touch
              soon via the email address you provided.
            </div>
            <button className={styles.homeButton} onClick={() => router.push('/dashboard')}>
              Return to Dashboard
            </button>
          </div>
        )

      default:
        return null
    }
  }

  // Render navigation buttons
  const renderNavButtons = () => {
    if (currentStep === 8) return null

    return (
      <div className={styles.navigationButtons}>
        {currentStep > 1 && (
          <button
            className={`${styles.navButton} ${styles.prevButton}`}
            onClick={handlePrevious}
            disabled={isSubmitting}
          >
            <ChevronLeftIcon /> Previous
          </button>
        )}

        {currentStep < 7 ? (
          <button className={`${styles.navButton} ${styles.nextButton}`} onClick={handleNext} disabled={isSubmitting}>
            Next <ChevronRightIcon />
          </button>
        ) : (
          <button className={`${styles.navButton} ${styles.nextButton}`} onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className={styles.loadingSpinner}></span>
                Submitting...
              </>
            ) : (
              'Submit Request'
            )}
          </button>
        )}
      </div>
    )
  }

  return (
    <Flex className={styles.bg}>
      {/* Animated background elements */}
      <div className={styles.bgAnimation}>
        <div className={styles.bgCircle}></div>
        <div className={styles.bgCircle}></div>
        <div className={styles.bgCircle}></div>
        <div className={styles.bgCircle}></div>
      </div>

      <div
        className={styles.formContainer}
        style={{
          opacity: animationReady ? 1 : 0,
          transform: animationReady ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.5s ease, transform 0.5s ease'
        }}
      >
        <div className={styles.header}>
          <h1 className={styles.headerTitle}>Reserved GPU Instances</h1>
          <p className={styles.headerSubtitle}>Request reserved GPU instances for your long-term computing needs</p>
        </div>

        {currentStep < 8 && renderProgressSteps()}
        {renderStepContent()}
        {renderNavButtons()}
      </div>
    </Flex>
  )
}

export default ReservedInstances
