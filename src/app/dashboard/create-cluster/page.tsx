'use client'

import React from 'react'

import { useState, useEffect, useCallback, useMemo } from 'react'
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

// Static data consolidated
const STATIC_DATA = {
  securityStandards: [
    { label: 'Any', name: 'any', image: <Icons.Any /> },
    { label: 'Secure Cloud', name: 'secureCloud', image: <Icons.SecureCloud /> },
    { label: 'Community Cloud', name: 'communityCloud', image: <Icons.CommunityCloud /> }
  ],
  availability: [
    { label: 'Show All', name: 'showAll', image: <Icons.ShowAll /> },
    { label: 'Show Only Available', name: 'showOnlyAvailable', image: <Icons.ShowAvailable /> }
  ],
  cpuNodes: [
    { label: 'CPU Node', name: 'cpuNode', image: <Icons.Socket /> },
    { label: 'V100 (16GB)', name: 'v100', image: <Icons.Nvidia /> },
    { label: 'RTX5000 ADA (20GB)', name: 'rtx5000ada', image: <Icons.Nvidia /> }
  ],
  selectImages: [
    { label: 'Bittensor', name: 'bittensor', image: <Icons.Nvidia /> },
    { label: 'Axolotl', name: 'axolotl', image: <Icons.Nvidia /> }
  ],
  selectValue: Array.from({ length: 5 }, (_, i) => ({ label: String(i + 1), name: String(i + 1) }))
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

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setIsImagesLoading(true)
        const [gpuData, imageData, regionData] = await Promise.all([
          getGPUAction(),
          getImageAction(),
          getRegionAction()
        ])

        // Add type validation and fallbacks
        if (gpuData?.data?.data) {
          setGpuCards(gpuData.data.data)
        }

        if (imageData?.data?.images) {
          setImageList(imageData.data.images)
        }

        if (regionData?.data?.regions) {
          setLocations(regionData.data.regions)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        // Could add proper error state handling here
      } finally {
        setIsLoading(false)
        setIsImagesLoading(false)
      }
    }

    fetchData()
  }, [])

  // Memoized derived state
  const regionList = useMemo(
    () => [
      { label: 'Any', name: 'any', image: <Icons.Any /> },
      ...locations.map((location) => ({
        label: location.name,
        name: location.name,
        // Dynamically assign an icon if available, or use Any icon as fallback
        image: location.name.toLowerCase().includes('africa') ? (
          <Icons.Africa />
        ) : location.name.toLowerCase().includes('asia') ? (
          <Icons.SouthAsia />
        ) : location.name.toLowerCase().includes('canada') ? (
          <Icons.Canada />
        ) : (
          <Icons.Any />
        )
      }))
    ],
    [locations]
  )

  // Filter GPU cards based on selected region and search term
  const filteredGpuCards = useMemo(() => {
    return gpuCards.filter((gpuCard) => {
      // First filter by region
      const matchesRegion = selectedRegion === 'any' || gpuCard.region_name === selectedRegion

      // Then filter by search term if one exists
      if (!searchTerm.trim()) return matchesRegion

      const searchLower = searchTerm.toLowerCase()

      // Search in GPU name
      const gpuName = (gpuCard.gpu || 'CPU only').toLowerCase()
      if (gpuName.includes(searchLower)) return matchesRegion

      // Search in flavor names
      const hasMatchingFlavor = gpuCard.flavors.some((flavor: Flavor) =>
        flavor.name.toLowerCase().includes(searchLower)
      )
      if (hasMatchingFlavor) return matchesRegion

      // Search in region name
      const regionName = (gpuCard.region_name || '').toLowerCase()
      if (regionName.includes(searchLower)) return matchesRegion

      return false
    })
  }, [gpuCards, selectedRegion, searchTerm])

  // Filter GPUs with available stock
  const availableGpuCards = useMemo(() => {
    return filteredGpuCards.filter((gpuCard) => gpuCard.flavors.some((flavor) => flavor.stock_available))
  }, [filteredGpuCards])

  // Filtered images based on selected region
  const filteredImages = useMemo(() => {
    return imageList.flatMap((regionImages) =>
      // Filter images by selected region if a specific region is selected
      selectedRegion === 'any' || regionImages.region_name === selectedRegion
        ? regionImages.images.slice(0, 4).map((image: Image) => ({
            ...image,
            green_status: regionImages.green_status,
            logo: regionImages.logo
          }))
        : []
    )
  }, [imageList, selectedRegion])

  // All images for modal
  const allImages = useMemo(() => {
    return imageList.flatMap((regionImages) =>
      regionImages.images.map((image: Image) => ({
        ...image,
        green_status: regionImages.green_status,
        logo: regionImages.logo
      }))
    )
  }, [imageList])

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

  const toggleGpuSelection = useCallback((gpuKey: string) => {
    setSelectedGpu((prev) => (prev === gpuKey ? null : gpuKey))
  }, [])

  const toggleImageSelection = useCallback((imageId: number) => {
    setSelectedImage((prev) => (prev === imageId ? null : imageId))
  }, [])

  const handleModalOpen = useCallback(() => {
    setModalOpen(true)
  }, [])

  const navigateToContinue = useCallback(() => {
    router.push('/dashboard/create-cluster/search')
  }, [router])

  // Modify the handleSummaryGpuSelection function
  const handleSummaryGpuSelection = useCallback((selectedGpuKey: string) => {
    setSelectedGpu(selectedGpuKey === 'none' ? null : selectedGpuKey)
  }, [])

  // Modify the handleSummaryImageSelection function
  const handleSummaryImageSelection = useCallback((selectedImageId: string) => {
    setSelectedImage(selectedImageId === 'none' ? null : Number(selectedImageId))
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

      // Extract flavor details
      const { cpu, ram, disk, ephemeral, stock_available } = selectedFlavor || {}

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
            </Flex>

            <FormSelect
              id={`flavor-${gpuKey}`}
              name="flavor"
              items={flavorOptions}
              defaultValue={String(flavorOptions[0]?.name)}
              onChange={(selectedValue) => handleFlavorChange(gpuKey, selectedValue)}
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
                onClick={() => toggleGpuSelection(gpuKey)}
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
    [selectedGpu, selectedFlavors, handleFlavorChange, toggleGpuSelection]
  )

  // Extract the ImageCard component
  const ImageCard = useCallback(
    ({ image }: { image: Image }) => {
      const isSelected = selectedImage === image.id

      return (
        <Flex
          className={`${styles.clusterCard} ${isSelected ? styles.selectedClusterCard : ''}`}
          key={image.id}
          direction="column"
          gap="2"
          onClick={() => toggleImageSelection(image.id)}
        >
          <div className={styles.selectionIndicator}>{isSelected ? <Icons.Check /> : <Icons.Uncheck />}</div>
          <Flex width="100%" justify="between">
            <Flex gap="2" className={styles.nvidiaTitle}>
              <Icons.Nvidia />
              <div>{image.name}</div>
            </Flex>
          </Flex>
          <Flex width="100%" direction="column" p="1" className={styles.gpuStatus} gap="2">
            <Flex align="center" gap="2">
              <div className={styles.contentTextWhite}>
                {image.description || `${image.type} ${image.version} - ${image.display_size}`}
              </div>
            </Flex>
          </Flex>
          <Flex width="100%" direction="column" p="1" className={styles.gpuStatus} gap="2">
            <Flex align="center" gap="2">
              <div className={styles.pathText}>Region: {image.region_name}</div>
            </Flex>
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

  // Add a reset function for the form
  const handleReset = useCallback(() => {
    setSelectedRegion('any')
    setSearchTerm('')
    setSelectedGpu(null)
    setSelectedImage(null)
    setSelectedFlavors({})
  }, [])

  // New function to handle flavor change in summary
  const handleSummaryFlavorChange = useCallback((gpuKey: string, flavorId: string) => {
    setSelectedFlavors((prev) => ({
      ...prev,
      [gpuKey]: flavorId
    }))
  }, [])

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
                filteredImages.map((image) => <ImageCard key={image.id} image={image} />)
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

      {/* Updated Summary Section */}
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
                ...availableGpuCards.map((gpuCard, index) => ({
                  label: gpuCard.gpu || 'CPU only',
                  name: `${gpuCard.gpu || 'cpu'}-${index}`
                }))
              ]}
              value={selectedGpu || 'none'}
              onChange={handleSummaryGpuSelection}
              className={styles.summarySelect}
            />
            {selectedGpu && (
              <Flex direction="column" gap="2">
                {availableGpuCards.map((gpuCard, index) => {
                  const gpuKey = `${gpuCard.gpu || 'cpu'}-${index}`
                  if (gpuKey === selectedGpu) {
                    const availableFlavors = gpuCard.flavors.filter((flavor) => flavor.stock_available)
                    const selectedFlavorId = selectedFlavors[gpuKey] || String(availableFlavors[0]?.id)
                    const selectedFlavor =
                      availableFlavors.find((flavor) => String(flavor.id) === selectedFlavorId) || availableFlavors[0]

                    return (
                      <React.Fragment key={gpuKey}>
                        <FormSelect
                          id={`summary-flavor-${gpuKey}`}
                          name={`summary-flavor-${gpuKey}`}
                          label="Select Flavor"
                          items={availableFlavors.map((flavor) => ({ label: flavor.name, name: String(flavor.id) }))}
                          value={selectedFlavorId}
                          onChange={(value) => handleSummaryFlavorChange(gpuKey, value)}
                          className={styles.summarySelect}
                        />
                        <Flex direction="column" className={styles.summarySpecs}>
                          <div>CPUs: {selectedFlavor.cpu}</div>
                          <div>RAM: {selectedFlavor.ram} GB</div>
                          <div>Disk: {selectedFlavor.disk} GB</div>
                          {selectedFlavor.ephemeral > 0 && <div>Ephemeral: {selectedFlavor.ephemeral} GB</div>}
                        </Flex>
                      </React.Fragment>
                    )
                  }
                  return null
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
                  if (image.id === selectedImage) {
                    return (
                      <React.Fragment key={image.id}>
                        <div className={styles.summaryImageDetails}>
                          {image.description || `${image.type} ${image.version} - ${image.display_size}`}
                        </div>
                        <div className={styles.summaryImageRegion}>Region: {image.region_name}</div>
                      </React.Fragment>
                    )
                  }
                  return null
                })}
              </Flex>
            )}

            {/* Existing summary items */}
            <Flex>
              <div className={styles.contentText}>Compute Types</div>
            </Flex>
            <Flex justify="between" className={styles.instanceArea} p="4">
              <div className={styles.contentTextWhite}>Show Spot Instances</div>
              <Switch.Root className={styles.switchRoot} id="spotInstance">
                <Switch.Thumb className={styles.switchThumb} />
              </Switch.Root>
            </Flex>

            <Flex justify="between" align="center" className={styles.instanceArea} p="4">
              <Flex gap="2">
                <Icons.Any />
                <div className={styles.priceTitle}>Lowest GPU Price</div>
              </Flex>
              <Flex direction="column">
                <div className={styles.priceTitle}>$0.24/hr</div>
                <div className={styles.contentText}>$5.81 per day</div>
              </Flex>
            </Flex>
          </Flex>
          <Flex ml="auto" mt="4" gap="4">
            <Button className={styles.defaultButton} onClick={handleReset}>
              Reset
            </Button>
            <Button className={styles.defaultButton} onClick={navigateToContinue}>
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
