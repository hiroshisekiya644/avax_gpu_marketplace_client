'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { MagnifyingGlassIcon } from '@radix-ui/react-icons'
import { Button, Flex, Grid, TextField } from '@radix-ui/themes'
import { useRouter } from 'next/navigation'
import { getGPUAction } from '@/api/GpuProvider'
import { getImageAction } from '@/api/ImageProvider'
import { getPriceBook } from '@/api/PriceBook'
import { getRegionAction } from '@/api/RegionProvider'
import DynamicSvgIcon from '@/components/icons/DynamicSvgIcon'
import { FormSelect, type SelectItem } from '@/components/select/FormSelect'
import { useResize } from '@/utils/Helper'
import styles from './page.module.css'

/**
 * Type definitions for data structures
 */
interface Flavor {
  id: number | string
  name: string
  cpu: number
  ram: number
  disk: number
  ephemeral: number
  stock_available: boolean
  gpu_count?: number
}

interface GpuCard {
  gpu: string
  region_name: string
  flavors: Flavor[]
}

interface Region {
  name: string
  id: string
}

interface Image {
  id: number
  name: string
  description: string | null
  path?: string
  region_name: string
  type: string
  version: string
  size: number
  display_size: string
  green_status?: string
  logo?: string | null
}

interface RegionImages {
  region_name: string
  green_status: 'GREEN' | 'NOT_GREEN'
  type: string
  logo: string | null
  images: Image[]
}

interface PriceItem {
  id: number
  name: string
  value: string
  original_value: string
  discount_applied: boolean
  start_time: string | null
  end_time: string | null
}

// Constants
const FLAVOR_MULTIPLIERS = [1, 2, 4, 8]
const DEFAULT_REGION = 'any'

/**
 * Icon components for UI elements
 */
const Icons = {
  Any: () => <DynamicSvgIcon height={22} className="rounded-none" iconName="any" />,
  Norway: () => <DynamicSvgIcon height={20} className="rounded-none" iconName="norway" />,
  US: () => <DynamicSvgIcon height={20} className="rounded-none" iconName="us" />,
  Canada: () => <DynamicSvgIcon height={20} className="rounded-none" iconName="canada" />,
  SecureCloud: () => <DynamicSvgIcon height={20} className="rounded-none" iconName="secure-cloud" />,
  CommunityCloud: () => <DynamicSvgIcon height={20} className="rounded-none" iconName="community-cloud" />,
  ShowAll: () => <DynamicSvgIcon height={20} className="rounded-none" iconName="show-all" />,
  ShowAvailable: () => <DynamicSvgIcon height={20} className="rounded-none" iconName="show-available" />,
  Nvidia: () => <DynamicSvgIcon height={20} className="rounded-none" iconName="nvidia-logo" />,
  Vram: () => <DynamicSvgIcon height={20} className="rounded-none" iconName="vram" />,
  Socket: () => <DynamicSvgIcon height={20} className="rounded-none" iconName="socket" />,
  RightArrow: () => <DynamicSvgIcon height={20} className="rounded-none" iconName="rightArrow" />,
  Check: () => <DynamicSvgIcon height={30} width={30} className="rounded-none" iconName="checked" />,
  Uncheck: () => <DynamicSvgIcon height={30} width={30} className="rounded-none" iconName="unchecked" />
}

/**
 * CreateCluster Component
 *
 * Provides a UI for creating GPU clusters with options to select:
 * - GPU type and configuration
 * - Base image
 * - Region
 * - Pricing options
 */
const CreateCluster = () => {
  const { isResponsive } = useResize()
  const router = useRouter()

  // UI state
  const [modalOpen, setModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRegion, setSelectedRegion] = useState(DEFAULT_REGION)

  // Selection state
  const [selectedGpu, setSelectedGpu] = useState<string | null>(null)
  const [selectedGpuRegion, setSelectedGpuRegion] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<number | null>(null)
  const [selectedFlavors, setSelectedFlavors] = useState<Record<string, string>>({})

  // Data state
  const [gpuCards, setGpuCards] = useState<GpuCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [imageList, setImageList] = useState<RegionImages[]>([])
  const [isImagesLoading, setIsImagesLoading] = useState(true)
  const [locations, setLocations] = useState<Region[]>([])
  const [priceBook, setPriceBook] = useState<PriceItem[]>([])
  const [isRenting, setIsRenting] = useState(false)

  /**
   * Fetch all required data on component mount
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setIsImagesLoading(true)

        const results = await Promise.allSettled([getGPUAction(), getImageAction(), getRegionAction(), getPriceBook()])

        if (results[0].status === 'fulfilled') {
          setGpuCards(results[0].value?.data?.data || [])
        } else {
          console.error('Error fetching GPU data:', results[0].reason)
          alert('Failed to load GPU data. Please refresh the page.')
        }

        if (results[1].status === 'fulfilled') {
          setImageList(results[1].value?.data?.images || [])
        } else {
          console.error('Error fetching image data:', results[1].reason)
        }

        if (results[2].status === 'fulfilled') {
          setLocations(results[2].value?.data?.regions || [])
        } else {
          console.error('Error fetching region data:', results[2].reason)
        }

        if (results[3].status === 'fulfilled') {
          setPriceBook(results[3].value?.data || [])
        } else {
          console.error('Error fetching price book data:', results[3].reason)
        }
      } catch (error) {
        console.error('Error in data fetching:', error)
        alert('Failed to load data. Please check your connection and try again.')
      } finally {
        setIsLoading(false)
        setIsImagesLoading(false)
      }
    }

    fetchData()
  }, [])

  /**
   * Generate region list with appropriate icons
   */
  const regionList = useMemo(() => {
    const getRegionIcon = (name: string) => {
      const lowerName = name.toLowerCase()
      if (lowerName.includes('us')) return <Icons.US />
      if (lowerName.includes('norway')) return <Icons.Norway />
      if (lowerName.includes('canada')) return <Icons.Canada />
      return <Icons.Any />
    }

    return [
      { label: 'Any', name: DEFAULT_REGION, image: <Icons.Any /> },
      ...locations.map((location) => ({
        label: location.name,
        name: location.name,
        image: getRegionIcon(location.name)
      }))
    ]
  }, [locations])

  /**
   * Filter GPU cards based on selected region and search term
   */
  const filteredGpuCards = useMemo(() => {
    if (!gpuCards.length) return []

    return gpuCards.filter((gpuCard) => {
      // Filter by region
      const matchesRegion = selectedRegion === DEFAULT_REGION || gpuCard.region_name === selectedRegion
      if (!matchesRegion) return false

      // Filter by search term
      if (!searchTerm.trim()) return true

      const searchLower = searchTerm.toLowerCase()
      const gpuName = (gpuCard.gpu || 'CPU only').toLowerCase()

      return (
        gpuName.includes(searchLower) ||
        gpuCard.flavors.some((flavor) => flavor.name.toLowerCase().includes(searchLower)) ||
        (gpuCard.region_name || '').toLowerCase().includes(searchLower)
      )
    })
  }, [gpuCards, selectedRegion, searchTerm])

  /**
   * Filter images based on selected GPU's region
   */
  const filteredImages = useMemo(() => {
    if (!imageList.length) return []

    // If a GPU is selected, filter by its region
    if (selectedGpuRegion) {
      return imageList
        .filter((regionImages) => regionImages.region_name === selectedGpuRegion)
        .flatMap((regionImages) =>
          regionImages.images.map((image) => ({
            ...image,
            green_status: regionImages.green_status,
            logo: regionImages.logo
          }))
        )
    }

    // Otherwise, filter by the selected region in the dropdown
    return imageList
      .filter((regionImages) => selectedRegion === DEFAULT_REGION || regionImages.region_name === selectedRegion)
      .flatMap((regionImages) =>
        regionImages.images.slice(0, 4).map((image) => ({
          ...image,
          green_status: regionImages.green_status,
          logo: regionImages.logo
        }))
      )
  }, [imageList, selectedRegion, selectedGpuRegion])

  /**
   * All images for modal view, filtered by selected GPU region if available
   */
  const allImages = useMemo(() => {
    if (!imageList.length) return []

    // If a GPU is selected, filter by its region
    if (selectedGpuRegion) {
      return imageList
        .filter((regionImages) => regionImages.region_name === selectedGpuRegion)
        .flatMap((regionImages) =>
          regionImages.images.map((image) => ({
            ...image,
            green_status: regionImages.green_status,
            logo: regionImages.logo
          }))
        )
    }

    // Otherwise, show all images
    return imageList.flatMap((regionImages) =>
      regionImages.images.map((image) => ({
        ...image,
        green_status: regionImages.green_status,
        logo: regionImages.logo
      }))
    )
  }, [imageList, selectedGpuRegion])

  /**
   * Calculate price for a GPU configuration
   *
   * @param gpuName - Name of the GPU
   * @param flavorIndex - Index of the flavor in the FLAVOR_MULTIPLIERS array
   * @param flavor - Optional flavor object for CPU-only instances
   * @returns Calculated price
   */
  const calculateGpuPrice = useCallback(
    (gpuName: string, flavorIndex = 0, flavor?: Flavor | null) => {
      // Handle CPU-only instances
      if (!gpuName && flavor) {
        const cpuPriceItem = priceBook.find((item) => item.name === 'vCPU (cpu-only-flavors)')
        const ramPriceItem = priceBook.find((item) => item.name === 'RAM (cpu-only-flavors)')
        const storagePriceItem = priceBook.find((item) => item.name === 'hypervisor-local-storage (cpu-only-flavors)')

        const cpuPrice = (Number.parseFloat(cpuPriceItem?.value || '0') || 0) * flavor.cpu
        const ramPrice = (Number.parseFloat(ramPriceItem?.value || '0') || 0) * flavor.ram
        const storagePrice = (Number.parseFloat(storagePriceItem?.value || '0') || 0) * flavor.disk

        return cpuPrice + ramPrice + storagePrice
      }

      // Handle GPU instances
      const priceItem = priceBook.find((item) => item.name === gpuName)
      if (!priceItem) return 0

      const basePrice = Number.parseFloat(priceItem.value) || 0

      // If we have a flavor object with gpu_count, use that for the multiplier
      if (flavor && flavor.gpu_count !== undefined && flavor.gpu_count > 0) {
        return basePrice * flavor.gpu_count
      }

      // Otherwise use the standard multiplier based on flavor index
      const multiplier = FLAVOR_MULTIPLIERS[flavorIndex] || 1
      return basePrice * multiplier
    },
    [priceBook]
  )

  /**
   * Calculate daily price from hourly price
   */
  const calculateDailyPrice = (hourlyPrice: number) => hourlyPrice * 24

  /**
   * Calculate price for the selected GPU configuration
   */
  const selectedGpuPrice = useMemo(() => {
    if (!selectedGpu || !gpuCards.length) return 0

    const [gpuName, index] = selectedGpu.split('-')
    const gpuCard = gpuCards.find((card, idx) => card.gpu === gpuName && idx === Number(index))
    if (!gpuCard) return 0

    const selectedFlavorId = selectedFlavors[selectedGpu]
    if (!selectedFlavorId) return 0

    const flavorIndex = gpuCard.flavors.findIndex((flavor) => String(flavor.id) === selectedFlavorId)
    if (flavorIndex === -1) return 0

    const selectedFlavor = gpuCard.flavors[flavorIndex]
    return calculateGpuPrice(gpuName, flavorIndex, selectedFlavor)
  }, [selectedGpu, gpuCards, selectedFlavors, calculateGpuPrice])

  // Event handlers
  const handleChangeRegion = useCallback(
    (selectedValue: string) => {
      setSelectedRegion(selectedValue)

      // Reset GPU and image selection when region changes
      if (selectedGpuRegion && selectedGpuRegion !== selectedValue && selectedValue !== DEFAULT_REGION) {
        setSelectedGpu(null)
        setSelectedGpuRegion(null)
        setSelectedImage(null)
        setSelectedFlavors({})
      }
    },
    [selectedGpuRegion]
  )

  const handleFlavorChange = useCallback((gpuKey: string, selectedFlavorId: string) => {
    setSelectedFlavors((prev) => ({
      ...prev,
      [gpuKey]: selectedFlavorId
    }))
  }, [])

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }, [])

  const toggleImageSelection = useCallback((imageId: number) => {
    setSelectedImage((prev) => (prev === imageId ? null : imageId))
    setModalOpen(false) // Close the modal when an image is selected
  }, [])

  const handleModalOpen = useCallback(() => {
    setModalOpen(true)
  }, [])

  /**
   * Handle the rent confirmation process
   */
  const handleRentConfirmation = useCallback(() => {
    if (!selectedGpu || !selectedImage || isRenting) return

    setIsRenting(true)

    // Get the GPU details
    const [gpuName, index] = selectedGpu.split('-')
    const gpuCard = gpuCards.find((card, idx) => card.gpu === gpuName && idx === Number(index))

    // Get the image details
    const selectedImageDetails = filteredImages.find((img) => img.id === selectedImage)

    // Create URL parameters for the deployment page
    const params = new URLSearchParams()
    params.append('gpu', gpuName || 'Unknown GPU')
    params.append('region', gpuCard?.region_name || 'Unknown Region')
    params.append('image', selectedImageDetails?.name || 'Unknown Image')
    params.append('imageId', selectedImage?.toString() || '0')
    params.append('price', selectedGpuPrice.toFixed(2))

    // Navigate to the deployment page
    router.push(`/dashboard/create-cluster/deploy-cluster?${params.toString()}`)
  }, [selectedGpu, selectedImage, selectedGpuPrice, isRenting, gpuCards, filteredImages, router])

  const toggleGpuSelection = useCallback(
    (gpuKey: string, flavorId: string, regionName: string) => {
      // If selecting the same GPU, just toggle it off
      if (selectedGpu === gpuKey) {
        setSelectedGpu(null)
        setSelectedGpuRegion(null)
        setSelectedImage(null) // Reset image selection when GPU is deselected
      } else {
        setSelectedGpu(gpuKey)
        setSelectedGpuRegion(regionName)
        setSelectedFlavors((prev) => ({
          ...prev,
          [gpuKey]: flavorId
        }))

        // Reset image selection when changing GPU
        setSelectedImage(null)
      }
    },
    [selectedGpu]
  )

  /**
   * Handle GPU selection from the summary section
   */
  const handleSummaryGpuSelection = useCallback(
    (selectedGpuKey: string) => {
      if (selectedGpuKey === 'none') {
        setSelectedGpu(null)
        setSelectedGpuRegion(null)
        setSelectedFlavors({})
        setSelectedImage(null) // Reset image selection when GPU is deselected
        return
      }

      setSelectedGpu(selectedGpuKey)

      // Set default flavor for the selected GPU
      const [gpuName, index] = selectedGpuKey.split('-')
      const selectedGpuCard = gpuCards.find((card, idx) => card.gpu === gpuName && idx === Number(index))

      if (!selectedGpuCard) return

      // Store the region of the selected GPU
      setSelectedGpuRegion(selectedGpuCard.region_name)

      // Reset image selection when changing GPU
      setSelectedImage(null)

      const defaultFlavor = selectedGpuCard.flavors.find((flavor) => flavor.stock_available)
      if (defaultFlavor) {
        setSelectedFlavors({
          [selectedGpuKey]: String(defaultFlavor.id)
        })
      }
    },
    [gpuCards]
  )

  const handleSummaryFlavorChange = useCallback((gpuKey: string, flavorId: string) => {
    setSelectedFlavors((prev) => ({
      ...prev,
      [gpuKey]: flavorId
    }))
  }, [])

  /**
   * Handle image selection from the summary section
   */
  const handleSummaryImageSelection = useCallback((selectedImageId: string) => {
    const newSelectedImage = selectedImageId === 'none' ? null : Number(selectedImageId)
    setSelectedImage(newSelectedImage)

    // Scroll to the selected image
    if (newSelectedImage) {
      requestAnimationFrame(() => {
        const selectedImageElement = document.getElementById(`image-${newSelectedImage}`)
        if (selectedImageElement) {
          selectedImageElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
      })
    }
  }, [])

  /**
   * Reset all form selections
   */
  const handleReset = useCallback(() => {
    setSelectedRegion(DEFAULT_REGION)
    setSearchTerm('')
    setSelectedGpu(null)
    setSelectedGpuRegion(null)
    setSelectedImage(null)
    setSelectedFlavors({})
    setModalOpen(false)
  }, [])

  /**
   * GPU Card component for displaying GPU options
   */
  const GpuCard = useCallback(
    ({ gpuCard, index }: { gpuCard: GpuCard; index: number }) => {
      const gpuKey = `${gpuCard.gpu || 'cpu'}-${index}`
      const isSelected = selectedGpu === gpuKey

      const flavorOptions: SelectItem[] = gpuCard.flavors.map((flavor) => ({
        label: flavor.name,
        name: String(flavor.id)
      }))

      // Get selected flavor or default
      const selectedFlavorId = selectedFlavors[gpuKey] || String(gpuCard.flavors[0]?.id || '')
      const selectedFlavor =
        gpuCard.flavors.find((flavor) => String(flavor.id) === selectedFlavorId) || gpuCard.flavors[0]

      const flavorIndex = gpuCard.flavors.findIndex((flavor) => String(flavor.id) === selectedFlavorId)
      const { cpu = 0, ram = 0, disk = 0, ephemeral = 0, stock_available = false } = selectedFlavor || {}
      const gpuPrice = calculateGpuPrice(gpuCard.gpu, flavorIndex, selectedFlavor)

      return (
        <Flex
          className={`${styles.gpuCard} ${isSelected ? styles.selectedGpuCard : ''}`}
          key={gpuKey}
          direction="column"
          gap="2"
          justify="between"
        >
          <Flex className={styles.gpuCardContent} direction="column" gap="2">
            <Flex width="100%" justify="between">
              <Flex gap="2" className={styles.nvidiaTitle}>
                {gpuCard.gpu ? <Icons.Nvidia /> : <Icons.Socket />}
                <div>{gpuCard.gpu || 'CPU only'}</div>
              </Flex>
              {gpuPrice > 0 && <div className={styles.gpuPrice}>${gpuPrice.toFixed(2)}/hr</div>}
            </Flex>
            <Flex width="100%" className={styles.regionInfo} align="center" gap="2">
              {gpuCard.region_name.includes('NORWAY') && (
                <DynamicSvgIcon height={16} className="rounded-none" iconName="norway" />
              )}
              {gpuCard.region_name.includes('CANADA') && (
                <DynamicSvgIcon height={16} className="rounded-none" iconName="canada" />
              )}
              {gpuCard.region_name.includes('US') && (
                <DynamicSvgIcon height={16} className="rounded-none" iconName="us" />
              )}
              <div className={styles.contentText}>
                <span className={styles.regionLabel}>Region:</span>
                <span className={styles.regionName}>{gpuCard.region_name}</span>
                {gpuCard.region_name.includes('NORWAY') || gpuCard.region_name.includes('CANADA') ? (
                  <span className={styles.greenBadge} title="Green Energy Data Center">
                    🌱
                  </span>
                ) : null}
              </div>
            </Flex>

            <FormSelect
              id={`flavor-${gpuKey}`}
              name="flavor"
              items={flavorOptions}
              value={selectedFlavorId}
              onChange={(selectedValue) => {
                handleFlavorChange(gpuKey, selectedValue)
              }}
              className={styles.selectValueBox}
            />

            {/* Specs display */}
            {[
              { icon: <Icons.Vram />, label: 'CPUs:', value: cpu },
              { icon: <Icons.Socket />, label: 'RAM:', value: `${ram} GB` },
              { icon: <Icons.Socket />, label: 'Disk:', value: `${disk} GB` },
              ...(ephemeral > 0 ? [{ icon: <Icons.Socket />, label: 'Ephemeral:', value: `${ephemeral} GB` }] : [])
            ].map((spec, i) => (
              <Flex key={i} width="100%" direction="column" p="1" className={styles.gpuStatus} gap="2">
                <Flex align="center" gap="2">
                  {spec.icon}
                  <div className={styles.contentText}>{spec.label}</div>
                  <div className={styles.contentTextWhite}>{spec.value}</div>
                </Flex>
              </Flex>
            ))}
          </Flex>

          <Flex>
            {stock_available ? (
              <Button
                className={`${styles.selectGPUButton} ${isSelected ? styles.selectedGPUButton : ''}`}
                onClick={() => toggleGpuSelection(gpuKey, selectedFlavorId, gpuCard.region_name)}
              >
                {isSelected ? 'Selected' : 'Select GPU'}
              </Button>
            ) : (
              <Flex width="100%" direction="column" p="1" className={styles.invalidGPUButton}>
                <b className={styles.contentText}>Out of Stock.</b>
                <p className={styles.contentText}>
                  Please try a lower number of GPUs. Or reserve future stock{' '}
                  <a href="/dashboard/quotes" className={styles.link}>
                    here
                  </a>
                </p>
              </Flex>
            )}
          </Flex>
        </Flex>
      )
    },
    [selectedGpu, selectedFlavors, handleFlavorChange, toggleGpuSelection, calculateGpuPrice]
  )

  /**
   * Image Card component for displaying image options
   */
  const ImageCard = useCallback(
    ({ image }: { image: Image }) => {
      const isSelected = selectedImage === image.id

      return (
        <Flex
          className={`${styles.clusterCard} ${isSelected ? styles.selectedClusterCard : ''} ${styles.imageCard}`}
          key={image.id}
          direction="column"
          onClick={() => toggleImageSelection(image.id)}
        >
          <div>{isSelected ? <Icons.Check /> : <Icons.Uncheck />}</div>
          <Flex className={styles.imageCardContent} direction="column">
            <div className={styles.imageName}>{image.name}</div>
            <div className={styles.imageDescription}>
              {image.description || `${image.type} ${image.version} - ${image.display_size}`}
            </div>
            <div className={styles.imageRegion}>Region: {image.region_name}</div>
          </Flex>
        </Flex>
      )
    },
    [selectedImage, toggleImageSelection]
  )

  /**
   * Loading state component
   */
  const LoadingState = useCallback(
    () => (
      <Flex className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <div className={styles.contentText}>Loading...</div>
      </Flex>
    ),
    []
  )

  /**
   * No results state component
   */
  const NoResultsState = useCallback(
    ({ message }: { message: string }) => (
      <Flex className={styles.noResultsContainer}>
        <div className={styles.contentText}>{message}</div>
      </Flex>
    ),
    []
  )

  // Scroll to selected image when it changes
  useEffect(() => {
    if (selectedImage) {
      const selectedImageElement = document.getElementById(`image-${selectedImage}`)
      if (selectedImageElement) {
        selectedImageElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }
  }, [selectedImage])

  // Check if rent button should be disabled
  const isRentDisabled = !selectedGpu || !selectedImage

  return (
    <Flex className={styles.bg} direction="column">
      {/* Header Section */}
      <Flex className={styles.header} p="4">
        <Flex justify="between" width="100%">
          <Flex direction="column">
            <div className={styles.headerTitle}>Create new GPU Cluster</div>
            <div className={styles.subTitle}>Choose your cluster for your GPU workload. Prices update in realtime.</div>
          </Flex>
          {!isResponsive && (
            <Flex align="center">
              <Button className={styles.headerButton}>
                <span>{'Select GPU First'}</span>
                <Icons.RightArrow />
              </Button>
            </Flex>
          )}
        </Flex>
      </Flex>

      {/* GPU Selection Section */}
      <Flex p="4" direction={isResponsive ? 'column' : 'row'} gap="2">
        <Flex direction="column" mt="4" width={{ initial: '100%', sm: '100%', md: '25%' }} gap="2">
          <div className={styles.contentTitle}>Select Your GPU Type</div>
          <div className={styles.contentText}>Customize your cluster for optimal performance and scalability</div>
          {/* Filters */}
          <Flex mt="4" gap="2" direction={isResponsive ? 'column' : 'row'}>
            <FormSelect
              id="location"
              name="location"
              items={regionList}
              label="Location"
              defaultValue={DEFAULT_REGION}
              className={styles.selectBox}
              onChange={handleChangeRegion}
            />
          </Flex>
        </Flex>
        <Flex direction="column" mt="4" width={{ initial: '100%', sm: '100%', md: '75%' }}>
          {/* Search */}
          <TextField.Root placeholder="Search…" className={styles.searchPad} onChange={handleSearch} value={searchTerm}>
            <TextField.Slot className={styles.iconSlot}>
              <MagnifyingGlassIcon height="24" width="24" />
            </TextField.Slot>
          </TextField.Root>
          {/* GPU Cards Grid */}
          <Flex mt="4" gap="2" direction={isResponsive ? 'column' : 'row'}>
            <Grid columns={{ initial: '1', sm: '1', md: '2', lg: '3' }} gap={{ initial: '2', sm: '4' }} width="100%">
              {isLoading ? (
                <LoadingState />
              ) : filteredGpuCards.length === 0 ? (
                <NoResultsState
                  message={
                    searchTerm
                      ? `No GPU types found matching "${searchTerm}". Please try a different search term.`
                      : 'No GPU types available for the selected region. Please try a different region.'
                  }
                />
              ) : (
                filteredGpuCards.map((gpuCard, index) => (
                  <GpuCard key={`${gpuCard.gpu}-${index}`} gpuCard={gpuCard} index={index} />
                ))
              )}
            </Grid>
          </Flex>
        </Flex>
      </Flex>

      {/* Cluster Base Image Section */}
      <Flex p="4" direction={isResponsive ? 'column' : 'row'} gap="2">
        <Flex direction="column" mt="4" width={{ initial: '100%', sm: '100%', md: '25%' }} gap="2">
          <div className={styles.contentTitle}>Cluster base image</div>
          <div className={styles.contentText}>
            Select a pre-configured cluster setup tailored to your specific needs, requiring no extra configurations and
            ready to integrate with your codebase immediately.
          </div>
          {selectedGpuRegion && (
            <div className={styles.regionFilterNotice}>
              Showing images compatible with region: <strong>{selectedGpuRegion}</strong>
            </div>
          )}
        </Flex>
        <Flex direction="column" mt="4" width={{ initial: '100%', sm: '100%', md: '75%' }}>
          <Flex gap="2" direction={isResponsive ? 'column' : 'row'}>
            <Grid columns={{ initial: '1', sm: '1', md: '2', lg: '3' }} gap={{ initial: '2', sm: '4' }} width="100%">
              {isImagesLoading ? (
                <LoadingState />
              ) : filteredImages.length === 0 ? (
                <NoResultsState
                  message={
                    selectedGpuRegion
                      ? `No images available for the selected GPU in region ${selectedGpuRegion}.`
                      : 'No images available. Please adjust your filters or try again later.'
                  }
                />
              ) : (
                filteredImages.map((image) => (
                  <div key={image.id} id={`image-${image.id}`} style={{ height: '200px' }}>
                    <ImageCard image={image} />
                  </div>
                ))
              )}
            </Grid>
          </Flex>
          <Flex mt="4">
            <Button className={styles.selectGPUButton} onClick={handleModalOpen}>
              Browse More Templates
            </Button>
          </Flex>
        </Flex>
      </Flex>

      {/* Summary Section */}
      <Flex p="4" direction={isResponsive ? 'column' : 'row'} gap="2">
        <Flex direction="column" mt="4" width={{ initial: '100%', sm: '100%', md: '25%' }} gap="2">
          <div className={styles.contentTitle}>Summary</div>
          <div className={styles.contentText}>Review and adjust your GPU and image selection.</div>
        </Flex>
        <Flex direction="column" mt="4" width={{ initial: '100%', sm: '100%', md: '75%' }}>
          <Flex className={styles.summary} p="4" gap="2" direction="column">
            <div className={styles.summaryTitle}>GPU Configuration</div>
            <FormSelect
              id="summary-gpu-select"
              name="summary-gpu-select"
              label="Select GPU"
              items={[
                { label: 'None', name: 'none' },
                ...filteredGpuCards.map((gpuCard, index) => {
                  const gpuKey = `${gpuCard.gpu || 'cpu'}-${index}`
                  return {
                    label: gpuCard.gpu || 'CPU only',
                    name: gpuKey
                  }
                })
              ]}
              value={selectedGpu || 'none'}
              onChange={handleSummaryGpuSelection}
              className={styles.summarySelect}
            />
            {selectedGpu && (
              <Flex direction="column" gap="2">
                {filteredGpuCards.map((gpuCard, index) => {
                  const gpuKey = `${gpuCard.gpu || 'cpu'}-${index}`
                  if (gpuKey !== selectedGpu) return null

                  const availableFlavors = gpuCard.flavors.filter((flavor) => flavor.stock_available === true)
                  const selectedFlavorId =
                    selectedFlavors[gpuKey] || (availableFlavors.length > 0 ? String(availableFlavors[0].id) : '')

                  const selectedFlavor =
                    availableFlavors.find((flavor) => String(flavor.id) === selectedFlavorId) ||
                    (availableFlavors.length > 0 ? availableFlavors[0] : null)

                  // Find the index of the selected flavor in the original flavors array
                  const flavorIndex = gpuCard.flavors.findIndex((flavor) => String(flavor.id) === selectedFlavorId)

                  // Calculate price for this GPU configuration
                  const gpuPrice = calculateGpuPrice(gpuCard.gpu, flavorIndex, selectedFlavor)

                  return (
                    <React.Fragment key={gpuKey}>
                      <FormSelect
                        id={`summary-flavor-${gpuKey}`}
                        name={`summary-flavor-${gpuKey}`}
                        label="Select Flavor"
                        items={gpuCard.flavors
                          .filter((flavor) => flavor.stock_available === true)
                          .map((flavor) => ({ label: flavor.name, name: String(flavor.id) }))}
                        value={selectedFlavorId}
                        onChange={(value) => handleSummaryFlavorChange(gpuKey, value)}
                        className={styles.summarySelect}
                      />
                      {selectedFlavor && (
                        <Flex direction="column" className={styles.summarySpecs}>
                          <div>CPUs: {selectedFlavor.cpu}</div>
                          <div>RAM: {selectedFlavor.ram} GB</div>
                          <div>Disk: {selectedFlavor.disk} GB</div>
                          {selectedFlavor.ephemeral > 0 && <div>Ephemeral: {selectedFlavor.ephemeral} GB</div>}
                          <div className={styles.summaryRegion}>Region: {gpuCard.region_name}</div>
                          {gpuPrice > 0 && (
                            <div className={styles.summaryPrice}>
                              Price: ${gpuPrice.toFixed(2)}/hr (${calculateDailyPrice(gpuPrice).toFixed(2)}/day)
                            </div>
                          )}
                        </Flex>
                      )}
                    </React.Fragment>
                  )
                })}
              </Flex>
            )}

            {/* Image selection summary */}
            <div className={styles.summaryTitle}>Base Image</div>
            <FormSelect
              id="summary-image-select"
              name="summary-image-select"
              label="Select Image"
              items={[
                { label: 'None', name: 'none' },
                ...filteredImages.map((image) => ({
                  label: image.name,
                  name: String(image.id)
                }))
              ]}
              value={selectedImage ? String(selectedImage) : 'none'}
              onChange={handleSummaryImageSelection}
              className={styles.summarySelect}
            />
            {selectedImage && (
              <Flex direction="column" gap="2">
                {filteredImages.map((image) => {
                  if (image.id !== selectedImage) return null

                  return (
                    <React.Fragment key={image.id}>
                      <div className={styles.summaryImageDetails}>
                        {image.description || `${image.type} ${image.version} - ${image.display_size}`}
                      </div>
                      <div className={styles.summaryImageRegion}>Region: {image.region_name}</div>
                    </React.Fragment>
                  )
                })}
              </Flex>
            )}

            {selectedGpu && (
              <Flex justify="between" align="center" className={styles.instanceArea} p="4">
                <Flex gap="2">
                  <Icons.Nvidia />
                  <div className={styles.priceTitle}>Selected GPU Price</div>
                </Flex>
                <Flex direction="column">
                  <div className={styles.priceTitle}>${selectedGpuPrice.toFixed(2)}/hr</div>
                  <div className={styles.contentText}>${calculateDailyPrice(selectedGpuPrice).toFixed(2)} per day</div>
                </Flex>
              </Flex>
            )}
          </Flex>
          <Flex ml="auto" mt="4" gap="4">
            <Button className={styles.defaultButton} onClick={handleReset}>
              Reset
            </Button>
            {/* Rent button */}
            <Button
              className={`${styles.defaultButton} ${isRentDisabled || isRenting ? styles.disabledButton : ''}`}
              onClick={handleRentConfirmation}
              disabled={isRentDisabled || isRenting}
            >
              {isRenting ? 'Processing...' : 'Rent'}
            </Button>
          </Flex>
        </Flex>
      </Flex>

      {/* Modal for browsing templates */}
      <Dialog.Root open={modalOpen} onOpenChange={setModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.dialogOverlay} />
          <Dialog.Content className={styles.dialogContent}>
            <Dialog.Title />
            <Flex direction="column">
              <Flex>Base Image</Flex>
              {selectedGpuRegion && (
                <div className={styles.modalRegionFilter}>
                  Showing images for region: <strong>{selectedGpuRegion}</strong>
                </div>
              )}
              <Flex className={styles.contentText} mt="10px" mb="10px">
                Select a pre-configured cluster setup tailored to your specific needs, requiring no extra configurations
                and ready to integrate with your codebase immediately.
              </Flex>
              <TextField.Root placeholder="Find a template to deploy..." className={styles.searchPad}>
                <TextField.Slot className={styles.iconSlot} style={{ paddingLeft: '10px' }}></TextField.Slot>
              </TextField.Root>
              <Flex direction="column" mt="10px" width={{ initial: '100%', sm: '100%' }} gap="12px">
                <Flex gap="6" direction={isResponsive ? 'column' : 'row'}>
                  <Grid columns={{ initial: '1', sm: '1', md: '2' }} gap={{ initial: '20px', sm: '20px' }} width="100%">
                    {isImagesLoading ? (
                      <LoadingState />
                    ) : allImages.length === 0 ? (
                      <NoResultsState
                        message={
                          selectedGpuRegion
                            ? `No images available for region ${selectedGpuRegion}.`
                            : 'No images available. Please try again later.'
                        }
                      />
                    ) : (
                      allImages.map((image) => <ImageCard key={image.id} image={image} />)
                    )}
                  </Grid>
                </Flex>
              </Flex>
            </Flex>
            <Dialog.Close />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Flex>
  )
}

export default CreateCluster
