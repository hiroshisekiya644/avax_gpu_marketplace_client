'use client'

import React, { useState, useEffect } from 'react'
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

// Type definitions
export type GPUCard = {
  name: string
  value: number
  vRam: string
  socket: string
  community?: string
  secure?: string
  available: boolean
}

export type ClusterBaseImage = {
  name: string
  description: string
  path: string
}

// Icon components
const IconComponents = {
  AnyIcon: () => <DynamicSvgIcon height={22} className="rounded-none" iconName="any" />,
  AfricaIcon: () => <DynamicSvgIcon height={20} className="rounded-none" iconName="za" />,
  SouthAsiaIcon: () => <DynamicSvgIcon height={20} className="rounded-none" iconName="in" />,
  CanadaIcon: () => <DynamicSvgIcon height={20} className="rounded-none" iconName="ca" />,
  SecureCloudIcon: () => <DynamicSvgIcon height={20} className="rounded-none" iconName="secure-cloud" />,
  CommunityCloudIcon: () => <DynamicSvgIcon height={20} className="rounded-none" iconName="community-cloud" />,
  ShowAllIcon: () => <DynamicSvgIcon height={20} className="rounded-none" iconName="show-all" />,
  ShowAvailableIcon: () => <DynamicSvgIcon height={20} className="rounded-none" iconName="show-available" />,
  NvidiaLogo: () => <DynamicSvgIcon height={20} className="rounded-none" iconName="nvidia-logo" />,
  VramLogo: () => <DynamicSvgIcon height={20} className="rounded-none" iconName="vram" />,
  SocketLogo: () => <DynamicSvgIcon height={20} className="rounded-none" iconName="socket" />,
  RightArrow: () => <DynamicSvgIcon height={20} className="rounded-none" iconName="rightArrow" />
}

// Static data
const STATIC_DATA = {
  location: [
    { label: 'Any', name: 'any', image: <IconComponents.AnyIcon /> },
    { label: 'Africa', name: 'africa', image: <IconComponents.AfricaIcon /> },
    { label: 'South Asia', name: 'southAsia', image: <IconComponents.SouthAsiaIcon /> },
    { label: 'Canada', name: 'canada', image: <IconComponents.CanadaIcon /> }
  ],
  securityStandards: [
    { label: 'Any', name: 'any', image: <IconComponents.AnyIcon /> },
    { label: 'Secure Cloud', name: 'secureCloud', image: <IconComponents.SecureCloudIcon /> },
    { label: 'Community Cloud', name: 'communityCloud', image: <IconComponents.CommunityCloudIcon /> }
  ],
  availability: [
    { label: 'Show All', name: 'showAll', image: <IconComponents.ShowAllIcon /> },
    { label: 'Show Only Available', name: 'showOnlyAvailable', image: <IconComponents.ShowAvailableIcon /> }
  ],
  cpuNodes: [
    { label: 'CPU Node', name: 'cpuNode', image: <IconComponents.SocketLogo /> },
    { label: 'V100 (16GB)', name: 'v100', image: <IconComponents.NvidiaLogo /> },
    { label: 'RTX5000 ADA (20GB)', name: 'rtx5000ada', image: <IconComponents.NvidiaLogo /> }
  ],
  selectImages: [
    { label: 'Bittensor', name: 'bittensor', image: <IconComponents.NvidiaLogo /> },
    { label: 'Axolotl', name: 'axolotl', image: <IconComponents.NvidiaLogo /> }
  ],
  selectValue: [
    { label: '1', name: '1' },
    { label: '2', name: '2' },
    { label: '3', name: '3' },
    { label: '4', name: '4' },
    { label: '5', name: '5' }
  ],
  clusterBaseImages: [
    {
      name: 'Ubuntu22, Cuda12',
      description:
        'Base image running Ubuntu 22 and CUDA 12. Ideal for devs who prefer to customize their environment. Fastest spin up times.',
      path: 'pytorch/pytorch:2.2.2-cuda12.1-c'
    },
    {
      name: 'Ubuntu23, Cuda13',
      description:
        'Base image running Ubuntu 22 and CUDA 12. Ideal for devs who prefer to customize their environment. Fastest spin up times.',
      path: 'pytorch/pytorch:2.2.2-cuda12.1-c'
    },
    {
      name: 'Ubuntu24, Cuda14',
      description:
        'Base image running Ubuntu 22 and CUDA 12. Ideal for devs who prefer to customize their environment. Fastest spin up times.',
      path: 'pytorch/pytorch:2.2.2-cuda12.1-c'
    },
    {
      name: 'Ubuntu25, Cuda15',
      description:
        'Base image running Ubuntu 22 and CUDA 12. Ideal for devs who prefer to customize their environment. Fastest spin up times.',
      path: 'pytorch/pytorch:2.2.2-cuda12.1-c'
    }
  ]
}

const CreateCluster = () => {
  const { isResponsive } = useResize()
  const router = useRouter()

  // State management
  const [modalOpen, setModalOpen] = useState(false)
  const [gpuCards, setGpuCards] = useState<any[]>([])
  const [selectedFlavors, setSelectedFlavors] = useState<{ [key: string]: string }>({})
  const [locations, setLocations] = useState<any[]>([])
  const [selectedRegion, setSelectedRegion] = useState<string>('any')
  const [isLoading, setIsLoading] = useState(true)

  // Derived state
  const regionList: SelectItem[] = React.useMemo(() => {
    const baseList = [{ label: 'Any', name: 'any' }]
    return [
      ...baseList,
      ...locations.map((location) => ({
        label: location.name,
        name: location.name
      }))
    ]
  }, [locations])

  // Data fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [gpuData, imageData, regionData] = await Promise.all([
          getGPUAction(),
          getImageAction(),
          getRegionAction()
        ])

        setGpuCards(gpuData.data.data)
        setLocations(regionData.data.regions)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Event handlers
  const handleChangeRegion = (selectedValue: string) => {
    setSelectedRegion(selectedValue)
  }

  const handleFlavorChange = (gpuKey: string, selectedFlavorId: string) => {
    setSelectedFlavors((prev) => ({
      ...prev,
      [gpuKey]: selectedFlavorId
    }))
  }

  // Render GPU card
  const renderGpuCard = (gpuCard: any, index: number) => {
    const gpuKey = `${gpuCard.gpu || 'cpu'}-${index}` // Unique key
    const flavorOptions: SelectItem[] = gpuCard.flavors.map((flavor: { name: any; id: any }) => ({
      label: flavor.name,
      name: String(flavor.id)
    }))

    // Get selected flavor details
    const selectedFlavor = gpuCard.flavors.find((flavor: { id: any }) => String(flavor.id) === selectedFlavors[gpuKey])
    const cpuCount = selectedFlavor ? selectedFlavor.cpu : gpuCard.flavors[0].cpu
    const ram = selectedFlavor ? selectedFlavor.ram : gpuCard.flavors[0].ram
    const disk = selectedFlavor ? selectedFlavor.disk : gpuCard.flavors[0].disk
    const ephemeral = selectedFlavor ? selectedFlavor.ephemeral : gpuCard.flavors[0].ephemeral
    const stockAvailable = selectedFlavor ? selectedFlavor.stock_available : gpuCard.flavors[0].stock_available

    return (
      <Flex className={styles.gpuCard} key={gpuKey} direction="column" gap="2" justify="between">
        <Flex className={styles.gpuCardContent} direction="column" gap="2">
          <Flex width="100%" justify="between">
            <Flex gap="2" className={styles.nvidiaTitle}>
              <IconComponents.NvidiaLogo />
              <div>{gpuCard.gpu || 'CPU only'}</div>
            </Flex>
          </Flex>

          <FormSelect
            id={`flavor-${gpuKey}`}
            name="flavor"
            items={flavorOptions}
            defaultValue={`${flavorOptions[0].name}`}
            onChange={(selectedValue) => handleFlavorChange(gpuKey, selectedValue)}
            className={styles.selectValueBox}
          />

          {/* Specs display */}
          {[
            { icon: <IconComponents.VramLogo />, label: 'CPUs:', value: cpuCount },
            { icon: <IconComponents.SocketLogo />, label: 'RAM:', value: `${ram} GB` },
            { icon: <IconComponents.SocketLogo />, label: 'Disk:', value: `${disk} GB` }
          ].map((spec, i) => (
            <Flex key={i} width="100%" direction="column" p="1" className={styles.gpuStatus} gap="2">
              <Flex align="center" gap="2">
                {spec.icon}
                <div className={styles.contentText}>{spec.label}</div>
                <div className={styles.contentTextWhite}>{spec.value}</div>
              </Flex>
            </Flex>
          ))}

          {ephemeral > 0 && (
            <Flex width="100%" direction="column" p="1" className={styles.gpuStatus} gap="2">
              <Flex align="center" gap="2">
                <IconComponents.SocketLogo />
                <div className={styles.contentText}>Ephemeral:</div>
                <div className={styles.contentTextWhite}>{ephemeral} GB</div>
              </Flex>
            </Flex>
          )}
        </Flex>

        <Flex>
          {stockAvailable ? (
            <Button className={styles.selectGPUButton}>Select GPU</Button>
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
  }

  // Render cluster base image card
  const renderClusterBaseImage = (image: ClusterBaseImage) => (
    <Flex className={styles.clusterCard} key={image.name} direction="column" gap="2">
      <Flex width="100%" justify="between">
        <Flex gap="2" className={styles.nvidiaTitle}>
          <IconComponents.NvidiaLogo />
          <div>{image.name}</div>
        </Flex>
      </Flex>
      <Flex width="100%" direction="column" p="1" className={styles.gpuStatus} gap="2">
        <Flex align="center" gap="2">
          <div className={styles.contentTextWhite}>{image.description}</div>
        </Flex>
      </Flex>
      <Flex width="100%" direction="column" p="1" className={styles.gpuStatus} gap="2">
        <Flex align="center" gap="2">
          <div className={styles.pathText}>{image.path}</div>
        </Flex>
      </Flex>
    </Flex>
  )

  // Component sections
  const renderHeader = () => (
    <Flex className={styles.header} p="4">
      <Flex justify="between" width="100%">
        <Flex direction="column">
          <div className={styles.headerTitle}>Create new GPU Cluster</div>
          <div className={styles.subTitle}>Choose your cluster for your GPU workload. Prices update in realtime.</div>
        </Flex>
        <Flex align="center" display={isResponsive ? 'none' : 'flex'}>
          <Button className={styles.headerButton}>
            <span>{'Select GPU First'}</span>
            <IconComponents.RightArrow />
          </Button>
        </Flex>
      </Flex>
    </Flex>
  )

  const renderGpuSelection = () => (
    <Flex p="4" direction={isResponsive ? 'column' : 'row'} gap="2">
      <Flex direction="column" mt="4" width={{ initial: '100%', sm: '100%', md: '25%' }} gap="2">
        <div className={styles.contentTitle}>Select Your GPU Type</div>
        <div className={styles.contentText}>Customize your cluster for optimal performance and scalability</div>
      </Flex>
      <Flex direction="column" mt="4" width={{ initial: '100%', sm: '100%', md: '75%' }}>
        {/* Search */}
        <TextField.Root placeholder="Search…" className={styles.searchPad}>
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
            defaultValue={`${regionList.length > 0 ? regionList[0].name : ''}`}
            className={styles.selectBox}
            onChange={handleChangeRegion}
          />
        </Flex>

        {/* GPU Cards Grid */}
        <Flex mt="4" gap="2" direction={isResponsive ? 'column' : 'row'}>
          <Grid columns={{ initial: '1', sm: '1', md: '2', lg: '3' }} gap={{ initial: '2', sm: '4' }} width="100%">
            {isLoading ? (
              <div>Loading GPU options...</div>
            ) : (
              gpuCards
                .filter((gpuCard) => selectedRegion === 'any' || gpuCard.region_name === selectedRegion)
                .map(renderGpuCard)
            )}
          </Grid>
        </Flex>
      </Flex>
    </Flex>
  )

  const renderClusterBaseImages = () => (
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
            {STATIC_DATA.clusterBaseImages.map(renderClusterBaseImage)}
          </Grid>
        </Flex>
        <Flex mt="4">
          <Button className={styles.selectGPUButton} onClick={() => setModalOpen(true)}>
            Browse More Templates
          </Button>
        </Flex>
      </Flex>
    </Flex>
  )

  const renderSummary = () => (
    <Flex p="4" direction={isResponsive ? 'column' : 'row'} gap="2">
      <Flex direction="column" mt="4" width={{ initial: '100%', sm: '100%', md: '25%' }} gap="2">
        <div className={styles.contentTitle}>Summary</div>
        <div className={styles.contentText}>Review your GPU selection and configuration details.</div>
      </Flex>
      <Flex direction="column" mt="4" width={{ initial: '100%', sm: '100%', md: '75%' }}>
        <Flex className={styles.summary} p="4" gap="2" direction="column">
          <Flex gap="2">
            <Flex width={{ initial: '66%' }}>
              <FormSelect
                id="cpuNode"
                name="cpuNode"
                items={STATIC_DATA.cpuNodes}
                defaultValue="cpuNode"
                className={styles.selectBox}
              />
            </Flex>
            <Flex width={{ initial: '33%' }}>
              <FormSelect
                id="valueNumber"
                name="valueNumber"
                items={STATIC_DATA.selectValue}
                defaultValue="1"
                className={styles.selectBox}
              />
            </Flex>
          </Flex>
          <Flex>
            <FormSelect
              id="location"
              name="location"
              items={STATIC_DATA.location}
              label="Location"
              defaultValue="any"
              className={styles.selectBox}
            />
          </Flex>
          <Flex>
            <FormSelect
              id="securityStandards"
              name="securityStandards"
              items={STATIC_DATA.securityStandards}
              label="Security Standards"
              defaultValue="any"
              className={styles.selectBox}
            />
          </Flex>
          <Flex>
            <FormSelect
              id="selectImages"
              name="selectImages"
              items={STATIC_DATA.selectImages}
              label="Images"
              defaultValue="bittensor"
              className={styles.selectBox}
            />
          </Flex>
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
              <IconComponents.AnyIcon />
              <div className={styles.priceTitle}>Lowest GPU Price</div>
            </Flex>
            <Flex direction="column">
              <div className={styles.priceTitle}>$0.24/hr</div>
              <div className={styles.contentText}>$5.81 per day</div>
            </Flex>
          </Flex>
        </Flex>
        <Flex ml="auto" mt="4" gap="4">
          <Button className={styles.defaultButton}>Reset</Button>
          <Button className={styles.defaultButton} onClick={() => router.push('/dashboard/create-cluster/search')}>
            Continue
          </Button>
        </Flex>
      </Flex>
    </Flex>
  )

  const renderTemplateModal = () => (
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
                  {STATIC_DATA.clusterBaseImages.map(renderClusterBaseImage)}
                </Grid>
              </Flex>
            </Flex>
          </Flex>
          <Dialog.Close />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )

  return (
    <Flex className={styles.bg} direction="column">
      {renderHeader()}
      {renderGpuSelection()}
      {renderClusterBaseImages()}
      {renderSummary()}
      {renderTemplateModal()}
    </Flex>
  )
}

export default CreateCluster
