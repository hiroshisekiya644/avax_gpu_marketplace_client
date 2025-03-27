'use client'

import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { MagnifyingGlassIcon } from '@radix-ui/react-icons'
import { Flex, Grid, TextField } from '@radix-ui/themes'
import { getGPUAction } from '@/api/GpuProvider'
import { getImageAction } from '@/api/ImageProvider'
import { getPriceBook } from '@/api/PriceBook'
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

/**
 * Icon components for UI elements
 */
const Icons = {
  Nvidia: () => <DynamicSvgIcon height={20} className="rounded-none" iconName="nvidia-logo" />,
  Vram: () => <DynamicSvgIcon height={20} className="rounded-none" iconName="vram" />,
  Socket: () => <DynamicSvgIcon height={20} className="rounded-none" iconName="socket" />,
  Ubuntu: () => <DynamicSvgIcon height={24} className="rounded-none" iconName="ubuntu-logo" />,
  GenAI: () => <DynamicSvgIcon height={24} className="rounded-none" iconName="ai-icon" />
}

/**
 * CreateCluster Component - Simplified version
 */
const CreateCluster = () => {
  const { isResponsive } = useResize()
  const [searchTerm, setSearchTerm] = useState('')

  // Data state
  const [gpuCards, setGpuCards] = useState<GpuCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [imageList, setImageList] = useState<RegionImages[]>([])
  const [isImagesLoading, setIsImagesLoading] = useState(true)
  const [priceBook, setPriceBook] = useState<PriceItem[]>([])

  // Selected image states
  const [selectedUbuntuImage, setSelectedUbuntuImage] = useState<string>('')
  const [selectedGenAIImage, setSelectedGenAIImage] = useState<string>('')

  /**
   * Fetch all required data on component mount
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setIsImagesLoading(true)

        const results = await Promise.allSettled([getGPUAction(), getImageAction(), getPriceBook()])

        if (results[0].status === 'fulfilled') {
          setGpuCards(results[0].value?.data?.data || [])
        } else {
          console.error('Error fetching GPU data:', results[0].reason)
        }

        if (results[1].status === 'fulfilled') {
          setImageList(results[1].value?.data?.images || [])

          // Set default selected images
          const ubuntuImages = results[1].value?.data?.images.find((img) => img.type === 'Ubuntu')?.images || []
          const genAIImages = results[1].value?.data?.images.find((img) => img.type === 'GenAI')?.images || []

          if (ubuntuImages.length > 0) {
            setSelectedUbuntuImage(ubuntuImages[0].id.toString())
          }

          if (genAIImages.length > 0) {
            setSelectedGenAIImage(genAIImages[0].id.toString())
          }
        } else {
          console.error('Error fetching image data:', results[1].reason)
        }

        if (results[2].status === 'fulfilled') {
          setPriceBook(results[2].value?.data || [])
        } else {
          console.error('Error fetching price book data:', results[2].reason)
        }
      } catch (error) {
        console.error('Error in data fetching:', error)
      } finally {
        setIsLoading(false)
        setIsImagesLoading(false)
      }
    }

    fetchData()
  }, [])

  /**
   * Filter GPU cards based on search term
   */
  const filteredGpuCards = useMemo(() => {
    if (!gpuCards.length) return []

    return gpuCards.filter((gpuCard) => {
      if (!searchTerm.trim()) return true

      const searchLower = searchTerm.toLowerCase()
      const gpuName = (gpuCard.gpu || 'CPU only').toLowerCase()

      return (
        gpuName.includes(searchLower) ||
        gpuCard.flavors.some((flavor) => flavor.name.toLowerCase().includes(searchLower)) ||
        (gpuCard.region_name || '').toLowerCase().includes(searchLower)
      )
    })
  }, [gpuCards, searchTerm])

  /**
   * Group images by type
   */
  const imagesByType = useMemo(() => {
    if (!imageList.length) return { Ubuntu: [], GenAI: [] }

    const result: Record<string, RegionImages[]> = {}

    imageList.forEach((regionImage) => {
      if (!result[regionImage.type]) {
        result[regionImage.type] = []
      }
      result[regionImage.type].push(regionImage)
    })

    return result
  }, [imageList])

  /**
   * Create select items for image dropdowns
   */
  const imageSelectItems = useMemo(() => {
    const result: Record<string, SelectItem[]> = { Ubuntu: [], GenAI: [] }

    Object.entries(imagesByType).forEach(([type, regions]) => {
      const items: SelectItem[] = []

      regions.forEach((region) => {
        region.images.forEach((image) => {
          items.push({
            label: `${image.name} (${region.region_name})`,
            name: image.id.toString(),
            image:
              region.green_status === 'GREEN' ? (
                <span style={{ color: 'green', marginRight: '4px' }}>♻️</span>
              ) : undefined
          })
        })
      })

      result[type] = items
    })

    return result
  }, [imagesByType])

  /**
   * Calculate price for a GPU configuration
   */
  const calculateGpuPrice = (gpuName: string, flavorIndex = 0) => {
    const priceItem = priceBook.find((item) => item.name === gpuName)
    if (!priceItem) return 0
    const basePrice = Number.parseFloat(priceItem.value) || 0
    return basePrice
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  /**
   * Loading state component
   */
  const LoadingState = () => (
    <Flex className={styles.loadingContainer}>
      <div className={styles.loadingSpinner}></div>
      <div className={styles.contentText}>Loading...</div>
    </Flex>
  )

  /**
   * No results state component
   */
  const NoResultsState = ({ message }: { message: string }) => (
    <Flex className={styles.noResultsContainer}>
      <div className={styles.contentText}>{message}</div>
    </Flex>
  )

  return (
    <Flex className={styles.bg} direction="column">
      <Flex className={styles.header} p="4">
        <Flex justify="between" width="100%">
          <Flex direction="column">
            <div className={styles.headerTitle}>Create new GPU Cluster</div>
            <div className={styles.subTitle}>Choose your cluster for your GPU workload. Prices update in realtime.</div>
          </Flex>
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
                      : 'No GPU types available. Please try again later.'
                  }
                />
              ) : (
                filteredGpuCards.map((gpuCard, index) => (
                  <Flex
                    className={styles.gpuCard}
                    key={`${gpuCard.gpu}-${index}`}
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
                        {calculateGpuPrice(gpuCard.gpu) > 0 && (
                          <div className={styles.gpuPrice}>${calculateGpuPrice(gpuCard.gpu).toFixed(2)}/hr</div>
                        )}
                      </Flex>
                      <Flex width="100%" className={styles.regionInfo} align="center" gap="2">
                        <div className={styles.contentText}>
                          <span className={styles.regionLabel}>Region:</span>
                          <span className={styles.regionName}>{gpuCard.region_name}</span>
                        </div>
                      </Flex>

                      {/* Specs display */}
                      {gpuCard.flavors[0] &&
                        [
                          { icon: <Icons.Vram />, label: 'CPUs:', value: gpuCard.flavors[0].cpu },
                          { icon: <Icons.Socket />, label: 'RAM:', value: `${gpuCard.flavors[0].ram} GB` },
                          { icon: <Icons.Socket />, label: 'Disk:', value: `${gpuCard.flavors[0].disk} GB` },
                          ...(gpuCard.flavors[0].ephemeral > 0
                            ? [
                                {
                                  icon: <Icons.Socket />,
                                  label: 'Ephemeral:',
                                  value: `${gpuCard.flavors[0].ephemeral} GB`
                                }
                              ]
                            : [])
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
                  </Flex>
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
            <Grid columns={{ initial: '1', sm: '1', md: '2' }} gap={{ initial: '2', sm: '4' }} width="100%">
              {isImagesLoading ? (
                <LoadingState />
              ) : Object.keys(imagesByType).length === 0 ? (
                <NoResultsState message="No images available. Please try again later." />
              ) : (
                <>
                  {/* Ubuntu Image Card */}
                  {imagesByType.Ubuntu && imagesByType.Ubuntu.length > 0 && (
                    <Flex className={`${styles.clusterCard} ${styles.imageCard}`} direction="column">
                      <Flex className={styles.imageCardContent} direction="column">
                        <Flex align="center" gap="2">
                          <Icons.Ubuntu />
                          <div className={styles.imageName}>Ubuntu</div>
                        </Flex>
                        <div className={styles.imageDescription}>
                          Ubuntu Server with CUDA drivers pre-installed for GPU computing
                        </div>

                        <Flex direction="column" gap="2" mt="2">
                          <FormSelect
                            id="ubuntuImage"
                            label="Select Ubuntu Image"
                            items={imageSelectItems.Ubuntu}
                            value={selectedUbuntuImage}
                            onChange={(value) => setSelectedUbuntuImage(value)}
                            className={styles.selectBox}
                          />
                        </Flex>
                      </Flex>
                    </Flex>
                  )}

                  {/* GenAI Image Card */}
                  {imagesByType.GenAI && imagesByType.GenAI.length > 0 && (
                    <Flex className={`${styles.clusterCard} ${styles.imageCard}`} direction="column">
                      <Flex className={styles.imageCardContent} direction="column">
                        <Flex align="center" gap="2">
                          <Icons.GenAI />
                          <div className={styles.imageName}>GenAI</div>
                        </Flex>
                        <div className={styles.imageDescription}>
                          Pre-configured images for AI and machine learning workloads with popular frameworks
                        </div>

                        <Flex direction="column" gap="2" mt="2">
                          <FormSelect
                            id="genaiImage"
                            label="Select GenAI Image"
                            items={imageSelectItems.GenAI}
                            value={selectedGenAIImage}
                            onChange={(value) => setSelectedGenAIImage(value)}
                            className={styles.selectBox}
                          />
                        </Flex>
                      </Flex>
                    </Flex>
                  )}
                </>
              )}
            </Grid>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}

export default CreateCluster
