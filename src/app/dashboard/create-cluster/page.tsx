'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { MagnifyingGlassIcon } from '@radix-ui/react-icons'
import * as Switch from '@radix-ui/react-switch'
import { Button, Flex, Grid, TextField } from '@radix-ui/themes'
import { useRouter } from 'next/navigation'
import { getAvailableGPUAction, deployVM } from '@/api/GpuProvider'
import { getImageAction } from '@/api/ImageProvider'
import { getUserKeyPairs, type KeyPair } from '@/api/KeyPair'
import { getPriceBook } from '@/api/PriceBook'
import { getRegionAction } from '@/api/RegionProvider'
import DynamicSvgIcon from '@/components/icons/DynamicSvgIcon'
import { FormSelect, type SelectItem } from '@/components/select/FormSelect'
import { Snackbar } from '@/components/snackbar/SnackBar'
import { useBalance } from '@/context/BalanceContext'
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
  features?: {
    network_optimised: boolean
    no_hibernation: boolean
    no_snapshot: boolean
    local_storage_only: boolean
  }
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
const PUBLIC_IP_HOURLY_RATE = 0.00672

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
  Uncheck: () => <DynamicSvgIcon height={30} width={30} className="rounded-none" iconName="unchecked" />,
  Key: () => <DynamicSvgIcon height={20} className="rounded-none" iconName="key-icon" />
}

// Add this function to generate random VM names
const generateRandomName = () => {
  const adjectives = [
    'focused',
    'elegant',
    'swift',
    'vibrant',
    'cosmic',
    'dynamic',
    'quantum',
    'stellar',
    'radiant',
    'nimble',
    'blazing',
    'serene',
    'mighty',
    'noble',
    'rapid',
    'silent'
  ]

  const nouns = [
    'maxwell',
    'newton',
    'einstein',
    'tesla',
    'curie',
    'turing',
    'hawking',
    'feynman',
    'bohr',
    'darwin',
    'galileo',
    'kepler',
    'planck',
    'dirac',
    'heisenberg',
    'fermi'
  ]

  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)]

  return `${randomAdjective}-${randomNoun}`
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

  // Use the balance context instead of local state
  const { balance, isLoading: balanceLoading } = useBalance()

  // UI state
  const [modalOpen, setModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRegion, setSelectedRegion] = useState(DEFAULT_REGION)

  // Selection state
  const [selectedGpu, setSelectedGpu] = useState<string | null>(null)
  const [selectedGpuRegion, setSelectedGpuRegion] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<number | null>(null)
  const [selectedImageType, setSelectedImageType] = useState<string>('all')
  const [selectedSshKey, setSelectedSshKey] = useState<string | null>(null)
  const [selectedFlavors, setSelectedFlavors] = useState<Record<string, string>>({})
  const [enableSshAccess, setEnableSshAccess] = useState(false)
  const [assignPublicIp, setAssignPublicIp] = useState(false)
  // Add a new state variable for the cluster name after the other selection state variables
  const [clusterName, setClusterName] = useState<string>(generateRandomName())
  // Data state
  const [gpuCards, setGpuCards] = useState<GpuCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [imageList, setImageList] = useState<RegionImages[]>([])
  const [isImagesLoading, setIsImagesLoading] = useState(true)
  const [locations, setLocations] = useState<Region[]>([])
  const [priceBook, setPriceBook] = useState<PriceItem[]>([])
  const [sshKeys, setSshKeys] = useState<KeyPair[]>([])
  const [isDeploying, setIsDeploying] = useState(false)

  /**
   * Fetch all required data on component mount
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setIsImagesLoading(true)

        const results = await Promise.allSettled([
          getAvailableGPUAction(),
          getImageAction(),
          getRegionAction(),
          getPriceBook(),
          getUserKeyPairs()
        ])

        if (results[0].status === 'fulfilled') {
          setGpuCards(results[0].value?.data?.data || [])
        } else {
          console.error('Error fetching GPU data:', results[0].reason)
          Snackbar({ message: 'Failed to load GPU data. Please refresh the page.', type: 'error' })
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

        if (results[4].status === 'fulfilled') {
          setSshKeys(results[4].value?.keyPairs || [])
          // Set the first SSH key as default if available
          if (results[4].value?.keyPairs?.length > 0) {
            setSelectedSshKey(String(results[4].value.keyPairs[0].id))
          }
        } else {
          console.error('Error fetching SSH keys:', results[4].reason)
        }
      } catch (error) {
        console.error('Error in data fetching:', error)
        Snackbar({ message: 'Failed to load data. Please check your connection and try again.', type: 'error' })
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
   * Generate SSH key list for the form select
   */
  const sshKeyList = useMemo(() => {
    // If a GPU region is selected, filter keys by that region
    const filteredKeys = selectedGpuRegion ? sshKeys.filter((key) => key.region === selectedGpuRegion) : sshKeys

    return filteredKeys.map((key) => ({
      label: `${key.ssh_key_name} (${key.region})`,
      name: String(key.id),
      image: <Icons.Key />
    }))
  }, [sshKeys, selectedGpuRegion])

  /**
   * Extract unique image types from the image list
   */
  const imageTypes = useMemo(() => {
    if (!imageList.length) return []

    const types = new Set<string>()
    types.add('all') // Add "all" as the default option

    imageList.forEach((regionImages) => {
      regionImages.images.forEach((image) => {
        if (image.type) {
          types.add(image.type)
        }
      })
    })

    return Array.from(types)
  }, [imageList])

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
   * Filter images based on selected GPU's region and image type
   */
  const filteredImages = useMemo(() => {
    if (!imageList.length) return []

    // First filter by region
    let filteredByRegion = imageList
    if (selectedGpuRegion) {
      filteredByRegion = imageList.filter((regionImages) => regionImages.region_name === selectedGpuRegion)
    } else if (selectedRegion !== DEFAULT_REGION) {
      filteredByRegion = imageList.filter((regionImages) => regionImages.region_name === selectedRegion)
    }

    // Then extract and filter images by type
    let result = filteredByRegion.flatMap((regionImages) =>
      regionImages.images.map((image) => ({
        ...image,
        green_status: regionImages.green_status,
        logo: regionImages.logo
      }))
    )

    // Filter by image type if not "all"
    if (selectedImageType !== 'all') {
      result = result.filter((image) => image.type === selectedImageType)
    }

    return result
  }, [imageList, selectedRegion, selectedGpuRegion, selectedImageType])

  /**
   * All images for modal view, filtered by selected GPU region and image type if available
   */
  const allImages = useMemo(() => {
    if (!imageList.length) return []

    // First filter by region if a GPU is selected
    let filteredByRegion = imageList
    if (selectedGpuRegion) {
      filteredByRegion = imageList.filter((regionImages) => regionImages.region_name === selectedGpuRegion)
    }

    // Then extract images
    let result = filteredByRegion.flatMap((regionImages) =>
      regionImages.images.map((image) => ({
        ...image,
        green_status: regionImages.green_status,
        logo: regionImages.logo
      }))
    )

    // Filter by image type if not "all"
    if (selectedImageType !== 'all') {
      result = result.filter((image) => image.type === selectedImageType)
    }

    return result
  }, [imageList, selectedGpuRegion, selectedImageType])

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
   * Calculate total price including GPU and additional services
   */
  const calculateTotalPrice = useCallback(
    (gpuPrice: number) => {
      let totalPrice = gpuPrice

      // Add public IP cost if selected
      if (assignPublicIp) {
        totalPrice += PUBLIC_IP_HOURLY_RATE
      }

      return totalPrice
    },
    [assignPublicIp]
  )

  /**
   * Calculate price for the selected GPU configuration
   */
  const selectedGpuPrice = useMemo(() => {
    if (!selectedGpu || !gpuCards.length) return 0

    const lastDash = selectedGpu.lastIndexOf('-')
    const gpuName = selectedGpu.slice(0, lastDash)
    const index = selectedGpu.slice(lastDash + 1)
    const searchGpuName = gpuName === 'cpu' ? '' : gpuName

    // First filter gpuCards by region if a region is selected
    const regionFilteredCards =
      selectedRegion !== DEFAULT_REGION ? gpuCards.filter((card) => card.region_name === selectedRegion) : gpuCards

    // Then find the matching GPU card by name and index
    const gpuCard = regionFilteredCards.find((card, idx) => card.gpu === searchGpuName && idx === Number(index))
    if (!gpuCard) return 0

    const selectedFlavorId = selectedFlavors[selectedGpu]
    if (!selectedFlavorId) return 0

    const flavorIndex = gpuCard.flavors.findIndex((flavor) => String(flavor.id) === selectedFlavorId)
    if (flavorIndex === -1) return 0

    const selectedFlavor = gpuCard.flavors[flavorIndex]
    return calculateGpuPrice(searchGpuName, flavorIndex, selectedFlavor)
  }, [selectedGpu, gpuCards, selectedFlavors, calculateGpuPrice, selectedRegion])

  /**
   * Calculate total price including all selected options
   */
  const totalPrice = useMemo(() => {
    return calculateTotalPrice(selectedGpuPrice)
  }, [selectedGpuPrice, calculateTotalPrice])

  // Calculate how many hours the user can run with current balance
  const calculateRuntime = useCallback(
    (hourlyPrice: number) => {
      if (!hourlyPrice || hourlyPrice <= 0) return Number.POSITIVE_INFINITY
      return balance / hourlyPrice
    },
    [balance]
  )

  // Format runtime in a human-readable way
  const formatRuntime = useCallback((hours: number) => {
    if (!isFinite(hours)) return '∞'
    if (hours < 1) return `${Math.round(hours * 60)} minutes`
    if (hours < 24) return `${Math.floor(hours)} hours ${Math.round((hours % 1) * 60)} minutes`
    const days = Math.floor(hours / 24)
    const remainingHours = Math.floor(hours % 24)
    return `${days} days ${remainingHours} hours`
  }, [])

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

  const handleImageTypeChange = useCallback((type: string) => {
    setSelectedImageType(type)
    setSelectedImage(null) // Reset image selection when changing type
  }, [])

  const handleSshKeyChange = useCallback((keyId: string) => {
    setSelectedSshKey(keyId)
  }, [])

  // Update the handleSshAccessToggle function to enforce the dependency
  const handleSshAccessToggle = useCallback(
    (checked: boolean) => {
      // If turning off SSH access (which means enable_port_randomization would be false)
      // and public IP is not assigned, we need to force public IP to be assigned
      if (!checked && !assignPublicIp) {
        setAssignPublicIp(true)
      }
      setEnableSshAccess(checked)
    },
    [assignPublicIp]
  )

  // Update the handlePublicIpToggle function to enforce the dependency
  const handlePublicIpToggle = useCallback(
    (checked: boolean) => {
      // If turning off public IP (assign_floating_ip would be false)
      // and SSH access is disabled (enable_port_randomization is false),
      // we need to force SSH access to be enabled
      if (!checked && !enableSshAccess) {
        setEnableSshAccess(true)
      }
      setAssignPublicIp(checked)
    },
    [enableSshAccess]
  )

  // Add a handler for the cluster name input
  const handleClusterNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setClusterName(e.target.value)
  }, [])

  /**
   * Handle the deploy confirmation process
   */
  const handleDeployConfirmation = useCallback(async () => {
    if (!selectedGpu || !selectedImage || !selectedSshKey || isDeploying) return

    // Check if VM name is provided
    if (!clusterName.trim()) {
      Snackbar({ message: 'Please enter a name for your virtual machine', type: 'error' })
      return
    }

    setIsDeploying(true)

    try {
      const lastDash = selectedGpu.lastIndexOf('-')
      const gpuName = selectedGpu.slice(0, lastDash)
      const index = selectedGpu.slice(lastDash + 1)
      const searchGpuName = gpuName === 'cpu' ? '' : gpuName

      // First filter gpuCards by region if a region is selected
      const regionFilteredCards =
        selectedRegion !== DEFAULT_REGION ? gpuCards.filter((card) => card.region_name === selectedRegion) : gpuCards

      // Then find the matching GPU card by name and index
      const gpuCard = regionFilteredCards.find((card, idx) => card.gpu === searchGpuName && idx === Number(index))

      // Get the selected SSH key
      const selectedKeyPair = sshKeys.find((key) => String(key.id) === selectedSshKey)

      // Check if the SSH key region matches the GPU region
      if (selectedKeyPair && gpuCard && selectedKeyPair.region !== gpuCard.region_name) {
        Snackbar({
          message: `The selected SSH key is for region ${selectedKeyPair.region} but the GPU is in ${gpuCard.region_name}. Please select a compatible SSH key.`,
          type: 'error'
        })
        setIsDeploying(false)
        return
      }

      // Get the image details
      const selectedImageDetails = filteredImages.find((img) => img.id === selectedImage)

      // Get the selected flavor
      const selectedFlavorId = selectedFlavors[selectedGpu]
      const selectedFlavor = gpuCard?.flavors.find((flavor) => String(flavor.id) === selectedFlavorId)

      if (!gpuCard || !selectedImageDetails || !selectedFlavor || !selectedKeyPair) {
        throw new Error('Missing required deployment information')
      }

      // Prepare deployment parameters
      const deployParams = {
        name: clusterName.trim(),
        image_name: selectedImageDetails.name,
        flavor_name: selectedFlavor.name,
        key_name: selectedKeyPair.ssh_key_name,
        region: gpuCard.region_name,
        assign_floating_ip: assignPublicIp,
        enable_port_randomization: enableSshAccess,
        count: 1,
        // Include flavor features if available
        flavor_features: selectedFlavor.features || {
          network_optimised: false,
          no_hibernation: false,
          no_snapshot: false,
          local_storage_only: false
        }
      }

      // Call the deployVM function
      const result = await deployVM(deployParams)

      // Show success message
      Snackbar({ message: `VM deployment initiated successfully! Status: ${result.status}`, type: 'success' })

      // Navigate to the instances page
      router.push('/dashboard/instances')
    } catch (error) {
      console.error('Deployment error:', error)
      Snackbar({
        message: `Failed to deploy VM: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      })
    } finally {
      setIsDeploying(false)
    }
  }, [
    selectedGpu,
    selectedImage,
    selectedSshKey,
    enableSshAccess,
    assignPublicIp,
    isDeploying,
    gpuCards,
    filteredImages,
    router,
    sshKeys,
    clusterName,
    selectedFlavors,
    selectedRegion
  ])

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
    setSelectedImageType('all')
    setEnableSshAccess(false)
    setAssignPublicIp(false)
    setClusterName(generateRandomName())
    // Don't reset SSH key as it's likely the user wants to keep using the same key
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
          style={{ position: 'relative' }} // Add relative positioning to the card
        >
          <div className={styles.checkboxContainer}>{isSelected ? <Icons.Check /> : <Icons.Uncheck />}</div>
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

  // Add the cluster name to the isDeployDisabled check
  const isDeployDisabled = !selectedGpu || !selectedImage || !selectedSshKey || !clusterName.trim()

  // Update SSH key selection when GPU region changes
  useEffect(() => {
    if (selectedGpuRegion && selectedSshKey) {
      // Find the currently selected SSH key
      const currentKey = sshKeys.find((key) => String(key.id) === selectedSshKey)

      // If the key doesn't match the selected region, find a compatible one
      if (currentKey && currentKey.region !== selectedGpuRegion) {
        // Find the first key that matches the selected region
        const compatibleKey = sshKeys.find((key) => key.region === selectedGpuRegion)
        if (compatibleKey) {
          setSelectedSshKey(String(compatibleKey.id))
        } else {
          // If no compatible key is found, clear the selection
          setSelectedSshKey(null)
        }
      }
    }
  }, [selectedGpuRegion, selectedSshKey, sshKeys])

  // Add a useEffect to ensure the dependency is maintained when component mounts
  useEffect(() => {
    // If public IP is not assigned and SSH access is disabled, enable SSH access
    if (!assignPublicIp && !enableSshAccess) {
      setEnableSshAccess(true)
    }
  }, [assignPublicIp, enableSshAccess])

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
          <Flex mt="4" gap="2" direction={isResponsive ? 'column' : 'row'}>
            <FormSelect
              id="image-type"
              name="image-type"
              label="Image Type"
              items={imageTypes.map((type) => ({ label: type.charAt(0).toUpperCase() + type.slice(1), name: type }))}
              value={selectedImageType}
              onChange={handleImageTypeChange}
              className={styles.selectBox}
            />
          </Flex>
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
          {/* Add the cluster name field to the summary section, right after the summaryTitle "Summary" */}
          <Flex className={styles.summary} p="4" gap="2" direction="column">
            <div className={styles.summaryTitle}>Virtual Machine Name</div>
            <TextField.Root
              placeholder="Enter a name for your virtual machine"
              className={styles.clusterNameInput}
              value={clusterName}
              onChange={handleClusterNameChange}
            />
            <div className={styles.nameHint}>
              The VM&apos;s name is auto-generated, but you can customize it if desired.
            </div>

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
                          <Flex justify="between">
                            <Flex direction="column" gap="1">
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

                            {selectedFlavor.features && (
                              <Flex direction="column" className={styles.featuresList}>
                                {selectedFlavor.features.no_hibernation && (
                                  <div className={styles.restrictionItem}>No Hibernation</div>
                                )}
                                {selectedFlavor.features.local_storage_only && (
                                  <div className={styles.restrictionItem}>Local Storage Only</div>
                                )}
                              </Flex>
                            )}
                          </Flex>
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

            {/* SSH Key summary */}
            <div className={styles.summaryTitle}>SSH Key</div>
            <FormSelect
              id="summary-ssh-key-select"
              name="summary-ssh-key-select"
              label="Select SSH Key"
              items={[{ label: 'None', name: 'none' }, ...sshKeyList]}
              value={selectedSshKey || 'none'}
              onChange={handleSshKeyChange}
              className={styles.summarySelect}
            />

            {/* SSH Access section */}
            <div className={styles.summaryTitle}>SSH Access</div>
            <div className={styles.networkOption}>
              <div className={styles.networkOptionDescription}>
                Enable SSH access to your VM by allowing incoming traffic on port 22.
                {!assignPublicIp && (
                  <div className={styles.dependencyNote}>Required when no public IP is assigned.</div>
                )}
                <a href="#" className={styles.learnMoreLink}>
                  Learn more
                </a>
              </div>
              <Flex align="center" gap="2">
                <label htmlFor="ssh-access-switch" className={styles.switchLabel}>
                  {enableSshAccess ? 'Enabled' : 'Disabled'}
                </label>
                <Switch.Root
                  id="ssh-access-switch"
                  className={styles.switchRoot}
                  checked={enableSshAccess}
                  onCheckedChange={handleSshAccessToggle}
                  disabled={!assignPublicIp} // Disable the switch if no public IP is assigned
                >
                  <Switch.Thumb className={styles.switchThumb} />
                </Switch.Root>
              </Flex>
            </div>

            {/* Public IP section */}
            <div className={styles.summaryTitle}>Public IP Address</div>
            <div className={styles.networkOption}>
              <div className={styles.networkOptionDescription}>
                Enable internet access for your VM by assigning a public IP at a nominal rate of $
                {PUBLIC_IP_HOURLY_RATE}/hr.
                <a href="#" className={styles.learnMoreLink}>
                  Learn more
                </a>
              </div>
              <Flex align="center" gap="2">
                <label htmlFor="public-ip-switch" className={styles.switchLabel}>
                  {assignPublicIp ? 'Assign Public IP' : 'No Public IP'}
                </label>
                <Switch.Root
                  id="public-ip-switch"
                  className={styles.switchRoot}
                  checked={assignPublicIp}
                  onCheckedChange={handlePublicIpToggle}
                >
                  <Switch.Thumb className={styles.switchThumb} />
                </Switch.Root>
              </Flex>
            </div>

            {selectedGpu && (
              <Flex justify="between" align="center" className={styles.instanceArea} p="4">
                <Flex gap="2">
                  <Icons.Nvidia />
                  <div className={styles.priceTitle}>Total Price</div>
                </Flex>
                <Flex direction="column">
                  <div className={styles.priceTitle}>${totalPrice.toFixed(2)}/hr</div>
                  <div className={styles.contentText}>${calculateDailyPrice(totalPrice).toFixed(2)} per day</div>
                  {assignPublicIp && (
                    <div className={styles.priceBreakdown}>Includes ${PUBLIC_IP_HOURLY_RATE}/hr for public IP</div>
                  )}
                </Flex>
              </Flex>
            )}
            {/* User Balance Section */}
            {selectedGpu && (
              <div className={styles.balanceInfo}>
                <div className={styles.balanceTitle}>Your Balance</div>
                {balanceLoading ? (
                  <div className={styles.balanceLoading}>Loading...</div>
                ) : (
                  <>
                    <div className={styles.balanceAmount}>${balance.toFixed(2)}</div>
                    <div className={styles.runtimeEstimate}>
                      Estimated runtime with current balance:
                      <span
                        className={`${styles.runtimeValue} ${
                          calculateRuntime(totalPrice) < 24 ? styles.lowBalance : ''
                        }`}
                      >
                        {formatRuntime(calculateRuntime(totalPrice))}
                      </span>
                    </div>
                    {calculateRuntime(totalPrice) < 24 && (
                      <div className={styles.lowBalanceWarning}>
                        Your balance is low for extended usage. Consider adding funds.
                      </div>
                    )}
                    <Flex justify="end" mt="2">
                      <Button className={styles.topUpButton} onClick={() => router.push('/dashboard/billing')}>
                        Top Up Balance
                      </Button>
                    </Flex>
                  </>
                )}
              </div>
            )}
          </Flex>
          <Flex ml="auto" mt="4" gap="4">
            <Button className={styles.defaultButton} onClick={handleReset}>
              Reset
            </Button>
            {/* Deploy button */}
            <Button
              className={`${styles.defaultButton} ${isDeployDisabled || isDeploying ? styles.disabledButton : ''}`}
              onClick={handleDeployConfirmation}
              disabled={isDeployDisabled || isDeploying}
            >
              {isDeploying ? 'Processing...' : 'Deploy'}
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
              <Flex mt="2" mb="4">
                <FormSelect
                  id="modal-image-type"
                  name="modal-image-type"
                  label="Image Type"
                  items={imageTypes.map((type) => ({
                    label: type.charAt(0).toUpperCase() + type.slice(1),
                    name: type
                  }))}
                  value={selectedImageType}
                  onChange={handleImageTypeChange}
                  className={styles.selectBox}
                />
              </Flex>
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
