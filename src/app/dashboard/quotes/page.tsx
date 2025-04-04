'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRef } from 'react'

import type React from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons'
import { Flex } from '@radix-ui/themes'
import { useRouter } from 'next/navigation'
import { getAvailableGPUAction } from '@/api/GpuProvider'
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
  { id: 3, title: 'Flavor', description: 'Select GPU configurations' }, // Changed from "Quantity" to "Flavor"
  { id: 4, title: 'Duration', description: 'Rental period' },
  { id: 5, title: 'Timing', description: 'When you need them' },
  { id: 6, title: 'Requirements', description: 'Additional details' },
  { id: 7, title: 'Review', description: 'Confirm your request' }
]

// Define interfaces for the API response
interface FlavorFeatures {
  network_optimised: boolean
  no_hibernation: boolean
  no_snapshot: boolean
  local_storage_only: boolean
}

interface Label {
  id: number
  label: string
}

// Update the Flavor interface to make additional properties optional
interface Flavor {
  id: number | string
  name: string
  cpu: number
  ram: number
  disk: number
  ephemeral: number | null
  stock_available: boolean
  // Make all additional properties optional
  display_name?: string | null
  region_name?: string
  gpu?: string
  gpu_count?: number
  created_at?: string
  labels?: Label[]
  features?: FlavorFeatures
}

interface GpuCard {
  gpu: string
  region_name: string
  flavors: Flavor[]
}

// Define a proper type for the GPU options
interface GpuOption {
  id: string
  label: string
  region: string
  originalData?: GpuCard // Make originalData optional
}

const ReservedInstances = () => {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [animationReady, setAnimationReady] = useState<boolean>(false)
  const [gpuCards, setGpuCards] = useState<GpuCard[]>([])
  const [isLoadingGpuData, setIsLoadingGpuData] = useState<boolean>(true)
  const [selectedGpuFlavors, setSelectedGpuFlavors] = useState<Flavor[]>([])

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

  // Fetch GPU data from API
  // Update the fetchGpuData function to handle type casting
  const fetchGpuData = async () => {
    try {
      setIsLoadingGpuData(true)
      const response = await getAvailableGPUAction()
      if (response && response.data && response.data.data) {
        // Cast the response data to GpuCard[] to ensure type compatibility
        setGpuCards(response.data.data as GpuCard[])
      }
    } catch (err) {
      console.error('Error fetching GPU data:', err)
      Snackbar({ message: 'Failed to load GPU data', type: 'error' })
    } finally {
      setIsLoadingGpuData(false)
    }
  }

  useEffect(() => {
    fetchGpuData()
  }, [])

  // Generate GPU options based on API data
  // Update the gpuOptions function to use the new type
  const gpuOptions = useCallback((): GpuOption[] => {
    // Filter GPU data to only include GPUs with at least one flavor where stock_available is false
    const unavailableGpus = gpuCards
      .filter((item) => item.flavors.some((flavor) => !flavor.stock_available))
      .map((item, index) => ({
        id: `${index}`,
        label: item.gpu || 'CPU only',
        region: item.region_name,
        originalData: item
      }))

    // Add "Other" option at the end
    return [...unavailableGpus, { id: 'G', label: 'Other', region: '' }]
  }, [gpuCards])

  // Update selected GPU flavors when gpuTypes changes
  // Update the useEffect that uses gpuOptions to handle the optional originalData
  useEffect(() => {
    if (formData.gpuTypes.length > 0 && gpuCards.length > 0) {
      const flavors: Flavor[] = []

      formData.gpuTypes.forEach((gpuTypeId) => {
        // Skip the "Other" option
        if (gpuTypeId === 'G') return

        const gpuOption = gpuOptions().find((option) => option.id === gpuTypeId)
        // Check if originalData exists before accessing it
        if (gpuOption && gpuOption.originalData) {
          // Add only flavors where stock_available is false
          const unavailableFlavors = gpuOption.originalData.flavors.filter((flavor) => !flavor.stock_available)
          flavors.push(...unavailableFlavors)
        }
      })

      setSelectedGpuFlavors(flavors)
    } else {
      setSelectedGpuFlavors([])
    }
  }, [formData.gpuTypes, gpuCards, gpuOptions])

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
  }, [currentStep, inputRefs.email, inputRefs.gpuCount, inputRefs.rentDuration, inputRefs.otherRequirements])

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
      console.error('Reservation error:', error)
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
              We&apos;ll use this to contact you about your GPU reservation request.
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
            {isLoadingGpuData ? (
              <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <div className={styles.loadingText}>Loading available GPU types...</div>
              </div>
            ) : (
              <div className={styles.optionsContainer}>
                {gpuOptions().map((option) => (
                  <div
                    key={option.id}
                    className={`${styles.optionItem} ${formData.gpuTypes.includes(option.id) ? styles.selected : ''}`}
                    onClick={() => handleGpuTypeToggle(option.id)}
                  >
                    <div className={styles.optionId}>{option.id}</div>
                    <div className={styles.optionLabel}>
                      {option.label} {option.region && `(${option.region})`}
                    </div>
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
            )}
          </div>
        )

      case 3:
        return (
          <div className={styles.formStep}>
            <div className={styles.stepTitle}>
              <div className={styles.stepNumber}>3</div>
              Which GPU configurations do you need? <span className={styles.required}>*</span>
            </div>
            <div className={styles.stepDescription}>
              Select the specific configurations you&apos;re interested in reserving.
            </div>

            {selectedGpuFlavors.length > 0 ? (
              <div className={styles.optionsContainer}>
                {/* Group flavors by GPU type */}
                {formData.gpuTypes
                  .filter((typeId) => typeId !== 'G') // Exclude "Other" option
                  .map((gpuTypeId) => {
                    const gpuOption = gpuOptions().find((option) => option.id === gpuTypeId)
                    if (!gpuOption || !gpuOption.originalData) return null

                    // Get flavors for this GPU type
                    const flavorsForThisGpu = selectedGpuFlavors.filter(
                      (flavor) => flavor.gpu === gpuOption.originalData?.gpu
                    )

                    if (flavorsForThisGpu.length === 0) return null

                    return (
                      <div key={gpuTypeId} className={styles.gpuFlavorGroup}>
                        <h3 className={styles.gpuFlavorGroupTitle}>
                          {gpuOption.label} ({gpuOption.region})
                        </h3>
                        {flavorsForThisGpu.map((flavor, index) => (
                          <div
                            key={`${flavor.id}-${index}`}
                            className={`${styles.optionItem} ${formData.gpuCount.includes(String(flavor.id)) ? styles.selected : ''}`}
                            onClick={() => {
                              const flavorId = String(flavor.id)
                              setFormData((prev) => ({
                                ...prev,
                                gpuCount: prev.gpuCount.includes(flavorId)
                                  ? prev.gpuCount.replace(flavorId, '')
                                  : prev.gpuCount + flavorId + ','
                              }))
                            }}
                          >
                            <div className={styles.optionId}>{index + 1}</div>
                            <div className={styles.optionLabel}>
                              {flavor.name} - {flavor.gpu || 'CPU'} x{flavor.gpu_count || 1} ({flavor.region_name})
                              <div className={styles.flavorDetails}>
                                CPU: {flavor.cpu} cores | RAM: {flavor.ram} GB | Disk: {flavor.disk} GB
                              </div>
                            </div>
                            <div className={styles.optionCheckbox}>
                              <CheckIcon className={styles.checkIcon} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })}
              </div>
            ) : (
              <div className={styles.noOptionsMessage}>
                Please select at least one GPU type in the previous step to see available configurations.
              </div>
            )}

            {formErrors.gpuCount && <div className={styles.errorMessage}>{formErrors.gpuCount}</div>}
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
                      const option = gpuOptions().find((opt) => opt.id === typeId)
                      return (
                        <div key={typeId} className={styles.summaryTag}>
                          {typeId === 'G' ? formData.customGpuType : option?.label}{' '}
                          {option?.region && `(${option.region})`}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className={styles.summaryItem}>
                <div className={styles.summaryLabel}>GPU Configurations:</div>
                <div className={styles.summaryValue}>
                  <div className={styles.summaryList}>
                    {formData.gpuCount
                      .split(',')
                      .filter(Boolean)
                      .map((flavorId) => {
                        const flavor = selectedGpuFlavors.find((f) => String(f.id) === flavorId)
                        return flavor ? (
                          <div key={flavorId} className={styles.summaryTag}>
                            {flavor.name} - {flavor.gpu || 'CPU'} x{flavor.gpu_count || 1} ({flavor.region_name})
                          </div>
                        ) : null
                      })}
                  </div>
                </div>
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
              Your GPU reservation request has been submitted successfully. We&apos;ll review your submission and be in
              touch soon via the email address you provided.
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

// CheckIcon component for the progress steps and option checkboxes
const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

export default ReservedInstances
