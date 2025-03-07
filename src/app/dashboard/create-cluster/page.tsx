'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { MagnifyingGlassIcon } from '@radix-ui/react-icons'
import * as Switch from '@radix-ui/react-switch'
import { Flex, TextField, Grid, Button } from '@radix-ui/themes'
import { useRouter } from 'next/navigation'
import DynamicSvgIcon from '@/components/icons/DynamicSvgIcon'
import { FormSelect, type SelectItem } from '@/components/select/FormSelect'
import { useResize } from '@/utils/Helper'
import styles from './page.module.css'

import { getGPUAction } from '@/api/GpuProvider'
import { getImageAction } from '@/api/ImageProvider'
import { getRegionAction } from '@/api/RegionProvider'
import { getPriceBook } from '@/api/PriceBook'

// Optimize interfaces by grouping related properties
interface Flavor {
  id: number | string
  name: string
  cpu: number
  ram: number
  disk: number
  ephemeral: number
  stock_available: boolean
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
  logo?: string
}

interface RegionImages {
  region_name: string
  images: Image[]
  green_status?: string
  logo?: string
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

// Define multiplier constants to improve readability
const FLAVOR_MULTIPLIERS = [1, 2, 4, 8]

// Icon components consolidated into a single object for better organization
const Icons = {
  Any: () => <DynamicSvgIcon height={22} className="rounded-none" iconName="any" />,
  Africa: () => <DynamicSvgIcon height={20} className="rounded-none" iconName="za" />,
  SouthAsia: () => <DynamicSvgIcon height={20} className="rounded-none" iconName="in" />,
  Canada: () => <DynamicSvgIcon height={20} className="rounded-none" iconName="ca" />,
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

const CreateCluster = () => {
  const { isResponsive } = useResize()
  const router = useRouter()

  // State management
  const [modalOpen, setModalOpen] = useState(false)
  const [gpuCards, setGpuCards] = useState<GpuCard[]>([])
  const [selectedFlavors, setSelectedFlavors] = useState<{ [key: string]: string }>({})
  const [locations, setLocations] = useState<Region[]>([])
  const [selectedRegion, setSelectedRegion] = useState<string>('any')
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [imageList, setImageList] = useState<RegionImages[]>([])
  const [isImagesLoading, setIsImagesLoading] = useState(true)
  const [selectedGpu, setSelectedGpu] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<number | null>(null)
  const [priceBook, setPriceBook] = useState<PriceItem[]>([])
  const [showSpotInstances, setShowSpotInstances] = useState(false)

  // Fetch data on component mount - optimized to handle errors better
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setIsImagesLoading(true)

        const [gpuData, imageData, regionData, priceBookData] = await Promise.all([
          getGPUAction().catch((err) => {
            console.error('Error fetching GPU data:', err)
            return { data: { data: [] } }
          }),
          getImageAction().catch((err) => {
            console.error('Error fetching image data:', err)
            return { data: { images: [] } }
          }),
          getRegionAction().catch((err) => {
            console.error('Error fetching region data:', err)
            return { data: { regions: [] } }
          }),
          getPriceBook().catch((err) => {
            console.error('Error fetching price book data:', err)
            return { data: [] }
          })
        ])

        // Set data with null checks
        setGpuCards(gpuData?.data?.data || [])
        setImageList(imageData?.data?.images || [])
        setLocations(regionData?.data?.regions || [])
        setPriceBook(priceBookData?.data || [])
      } catch (error) {
        console.error('Error in data fetching:', error)
      } finally {
        setIsLoading(false)
        setIsImagesLoading(false)
      }
    }

    fetchData()
  }, [])

  // Memoized derived state
  const regionList = useMemo(() => {
    const getRegionIcon = (name: string) => {
      const lowerName = name.toLowerCase()
      if (lowerName.includes('africa')) return <Icons.Africa />
      if (lowerName.includes('asia')) return <Icons.SouthAsia />
      if (lowerName.includes('canada')) return <Icons.Canada />
      return <Icons.Any />
    }

    return [
      { label: 'Any', name: 'any', image: <Icons.Any /> },
      ...locations.map((location) => ({
        label: location.name,
        name: location.name,
        image: getRegionIcon(location.name)
      }))
    ]
  }, [locations])

  // Filter GPU cards based on selected region and search term
  const filteredGpuCards = useMemo(() => {
    if (!gpuCards.length) return []

    return gpuCards.filter((gpuCard) => {
      // First filter by region
      const matchesRegion = selectedRegion === 'any' || gpuCard.region_name === selectedRegion
      if (!matchesRegion) return false

      // Then filter by search term if one exists
      if (!searchTerm.trim()) return true

      const searchLower = searchTerm.toLowerCase()

      // Search in GPU name
      const gpuName = (gpuCard.gpu || 'CPU only').toLowerCase()
      if (gpuName.includes(searchLower)) return true

      // Search in flavor names
      if (gpuCard.flavors.some((flavor) => flavor.name.toLowerCase().includes(searchLower))) return true

      // Search in region name
      const regionName = (gpuCard.region_name || '').toLowerCase()
      if (regionName.includes(searchLower)) return true

      return false
    })
  }, [gpuCards, selectedRegion, searchTerm])

  // Filter GPUs with available stock
  const availableGpuCards = useMemo(() => {
    return filteredGpuCards.filter((gpuCard) => gpuCard.flavors.some((flavor) => flavor.stock_available))
  }, [filteredGpuCards])

  // Filtered images based on selected region - optimized to reduce calculations
  const filteredImages = useMemo(() => {
    if (!imageList.length) return []

    return imageList
      .filter((regionImages) => selectedRegion === 'any' || regionImages.region_name === selectedRegion)
      .flatMap((regionImages) =>
        regionImages.images.slice(0, 4).map((image) => ({
          ...image,
          green_status: regionImages.green_status,
          logo: regionImages.logo
        }))
      )
  }, [imageList, selectedRegion])

  // All images for modal
  const allImages = useMemo(() => {
    if (!imageList.length) return []

    return imageList.flatMap((regionImages) =>
      regionImages.images.map((image) => ({
        ...image,
        green_status: regionImages.green_status,
        logo: regionImages.logo
      }))
    )
  }, [imageList])

  // Optimize price calculation functions
  const calculateGpuPrice = useCallback(
    (gpuName: string, flavorIndex = 0) => {
      const priceItem = priceBook.find((item) => item.name === gpuName)
      if (!priceItem) return 0

      const basePrice = Number.parseFloat(priceItem.value)
      const multiplier = FLAVOR_MULTIPLIERS[flavorIndex] || 1

      return basePrice * multiplier
    },
    [priceBook]
  )

  // Get the lowest GPU price from the price book - optimized to reduce calculations
  const lowestGpuPrice = useMemo(() => {
    if (!priceBook.length) return 0

    const gpuPrices = priceBook
      .filter((item) => !item.name.includes('vCPU') && !item.name.includes('RAM') && !item.name.includes('storage'))
      .map((item) => Number.parseFloat(item.value))
      .filter((price) => price > 0)

    return gpuPrices.length ? Math.min(...gpuPrices) : 0
  }, [priceBook])

  // Calculate daily price from hourly price - simple function, no need for useCallback
  const calculateDailyPrice = (hourlyPrice: number) => hourlyPrice * 24

  // Get the price for the selected GPU - optimized to reduce calculations
  const selectedGpuPrice = useMemo(() => {
    if (!selectedGpu || !gpuCards.length) return 0

    const [gpuName, index] = selectedGpu.split('-')
    const gpuCard = gpuCards.find((card, idx) => card.gpu === gpuName && idx === Number(index))
    if (!gpuCard) return 0

    const selectedFlavorId = selectedFlavors[selectedGpu]
    const flavorIndex = gpuCard.flavors.findIndex((flavor) => String(flavor.id) === selectedFlavorId)

    return calculateGpuPrice(gpuName, flavorIndex)
  }, [selectedGpu, gpuCards, selectedFlavors, calculateGpuPrice])

  // Event handlers - memoized to prevent unnecessary re-renders
  const handleChangeRegion = useCallback((selectedValue: string) => {
    setSelectedRegion(selectedValue)
  }, [])

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

  const toggleSpotInstances = useCallback(() => {
    setShowSpotInstances((prev) => !prev)
  }, [])

  // Update the navigateToContinue function to check if both GPU and image are selected
  const navigateToContinue = useCallback(() => {
    if (selectedGpu && selectedImage) {
      router.push('/dashboard/create-cluster/search')
    }
  }, [router, selectedGpu, selectedImage])

  // Modify the toggleGpuSelection function
  const toggleGpuSelection = useCallback((gpuKey: string, flavorId: string) => {
    setSelectedGpu(gpuKey)
    setSelectedFlavors((prev) => ({
      ...prev,
      [gpuKey]: flavorId
    }))
  }, [])

  // Optimize the handleSummaryGpuSelection function
  const handleSummaryGpuSelection = useCallback(
    (selectedGpuKey: string) => {
      if (selectedGpuKey === 'none') {
        setSelectedGpu(null)
        setSelectedFlavors({})
        return
      }

      setSelectedGpu(selectedGpuKey)

      // Set the default flavor for the selected GPU
      const [gpuName, index] = selectedGpuKey.split('-')
      const selectedGpuCard = gpuCards.find((card, idx) => card.gpu === gpuName && idx === Number(index))

      if (!selectedGpuCard) return

      const defaultFlavor = selectedGpuCard.flavors.find((flavor) => flavor.stock_available)
      if (defaultFlavor) {
        setSelectedFlavors({
          [selectedGpuKey]: String(defaultFlavor.id)
        })
      }
    },
    [gpuCards]
  )

  // Modify the handleSummaryFlavorChange function
  const handleSummaryFlavorChange = useCallback((gpuKey: string, flavorId: string) => {
    setSelectedFlavors((prev) => ({
      ...prev,
      [gpuKey]: flavorId
    }))
  }, [])

  // Optimize the handleSummaryImageSelection function
  const handleSummaryImageSelection = useCallback((selectedImageId: string) => {
    const newSelectedImage = selectedImageId === 'none' ? null : Number(selectedImageId)
    setSelectedImage(newSelectedImage)

    // Scroll to the selected image in the image card section
    if (newSelectedImage) {
      requestAnimationFrame(() => {
        const selectedImageElement = document.getElementById(`image-${newSelectedImage}`)
        if (selectedImageElement) {
          selectedImageElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
      })
    }
  }, [])

  // Add a reset function for the form
  const handleReset = useCallback(() => {
    setSelectedRegion('any')
    setSearchTerm('')
    setSelectedGpu(null)
    setSelectedImage(null)
    setSelectedFlavors({})
    setModalOpen(false)
    setShowSpotInstances(false)
  }, [])

  // Extract the GpuCard component for better code organization
  const GpuCard = useCallback(
    ({ gpuCard, index }: { gpuCard: GpuCard; index: number }) => {
      const gpuKey = `${gpuCard.gpu || 'cpu'}-${index}`
      const isSelected = selectedGpu === gpuKey

      const flavorOptions: SelectItem[] = gpuCard.flavors.map((flavor) => ({
        label: flavor.name,
        name: String(flavor.id)
      }))

      // Get selected flavor or default to first flavor
      const selectedFlavorId = selectedFlavors[gpuKey] || String(gpuCard.flavors[0]?.id)
      const selectedFlavor =
        gpuCard.flavors.find((flavor) => String(flavor.id) === selectedFlavorId) || gpuCard.flavors[0]

      // Find the index of the selected flavor
      const flavorIndex = gpuCard.flavors.findIndex((flavor) => String(flavor.id) === selectedFlavorId)

      // Extract flavor details
      const { cpu, ram, disk, ephemeral, stock_available } = selectedFlavor || {}

      // Get the price for this GPU with the appropriate multiplier
      const gpuPrice = calculateGpuPrice(gpuCard.gpu, flavorIndex)

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
                <Icons.Nvidia />
                <div>{gpuCard.gpu || 'CPU only'}</div>
              </Flex>
              {gpuPrice > 0 && <div className={styles.gpuPrice}>${gpuPrice.toFixed(2)}/hr</div>}
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
                onClick={() => toggleGpuSelection(gpuKey, selectedFlavorId)}
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

  // Extract the ImageCard component
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
          <div className={styles.selectionIndicator}>{isSelected ? <Icons.Check /> : <Icons.Uncheck />}</div>
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

  // Loading and empty state components
  const LoadingState = useCallback(
    () => (
      <Flex className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <div className={styles.contentText}>Loading...</div>
      </Flex>
    ),
    []
  )

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
        </Flex>
        <Flex direction="column" mt="4" width={{ initial: '100%', sm: '100%', md: '75%' }}>
          {/* Search */}
          <TextField.Root placeholder="Search…" className={styles.searchPad} onChange={handleSearch} value={searchTerm}>
            <TextField.Slot className={styles.iconSlot}>
              <MagnifyingGlassIcon height="24" width="24" />
            </TextField.Slot>
          </TextField.Root>

          {/* Filters */}
          <Flex mt="4" gap="2" direction={isResponsive ? 'column' : 'row'}>
            <FormSelect
              id="location"
              name="location"
              items={regionList}
              label="Location"
              defaultValue="any"
              className={styles.selectBox}
              onChange={handleChangeRegion}
            />
          </Flex>

          {/* GPU Cards Grid */}
          <Flex mt="4" gap="2" direction={isResponsive ? 'column' : 'row'}>
            <Grid columns={{ initial: '1', sm: '1', md: '2', lg: '3' }} gap={{ initial: '2', sm: '4' }} width="100%">
              {isLoading ? (
                <LoadingState />
              ) : filteredGpuCards.length === 0 ? (
                <NoResultsState message="No GPU types available. Please adjust your filters." />
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
        </Flex>
        <Flex direction="column" mt="4" width={{ initial: '100%', sm: '100%', md: '75%' }}>
          <Flex gap="2" direction={isResponsive ? 'column' : 'row'}>
            <Grid columns={{ initial: '1', sm: '1', md: '2', lg: '3' }} gap={{ initial: '2', sm: '4' }} width="100%">
              {isImagesLoading ? (
                <LoadingState />
              ) : filteredImages.length === 0 ? (
                <NoResultsState message="No images available. Please adjust your filters or try again later." />
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

                  // Get the price for this GPU with the appropriate multiplier
                  const gpuPrice = calculateGpuPrice(gpuCard.gpu, flavorIndex)

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

            {/* Compute Types */}
            <Flex>
              <div className={styles.contentText}>Compute Types</div>
            </Flex>
            <Flex justify="between" className={styles.instanceArea} p="4">
              <div className={styles.contentTextWhite}>Show Spot Instances</div>
              <Switch.Root
                className={styles.switchRoot}
                id="spotInstance"
                checked={showSpotInstances}
                onCheckedChange={toggleSpotInstances}
              >
                <Switch.Thumb className={styles.switchThumb} />
              </Switch.Root>
            </Flex>

            <Flex justify="between" align="center" className={styles.instanceArea} p="4">
              <Flex gap="2">
                <Icons.Any />
                <div className={styles.priceTitle}>Lowest GPU Price</div>
              </Flex>
              <Flex direction="column">
                <div className={styles.priceTitle}>${lowestGpuPrice.toFixed(2)}/hr</div>
                <div className={styles.contentText}>${calculateDailyPrice(lowestGpuPrice).toFixed(2)} per day</div>
              </Flex>
            </Flex>

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
            {/* Update the Continue button to be disabled when either GPU or image is not selected */}
            <Button
              className={`${styles.defaultButton} ${!selectedGpu || !selectedImage ? styles.disabledButton : ''}`}
              onClick={navigateToContinue}
              disabled={!selectedGpu || !selectedImage}
            >
              Continue
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
                      <NoResultsState message="No images available. Please try again later." />
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
