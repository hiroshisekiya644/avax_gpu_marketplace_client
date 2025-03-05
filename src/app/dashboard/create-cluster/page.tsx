'use client'

import React, { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { MagnifyingGlassIcon } from '@radix-ui/react-icons'
import * as Switch from '@radix-ui/react-switch'
import { Flex, TextField, Grid, Button } from '@radix-ui/themes'
import { useRouter } from 'next/navigation'
import DynamicSvgIcon from '@/components/icons/DynamicSvgIcon'
import { FormSelect, SelectItem } from '@/components/select/FormSelect'
import { useResize } from '@/utils/Helper'
import styles from './page.module.css'

import { getGPUAction } from '@/api/GpuProvider'
import { getImageAction } from '@/api/ImageProvider'

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

const AnyIcon = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="any" />
const AfricaIcon = () => <DynamicSvgIcon height={20} className="rounded-none" iconName="za" />
const SouthAsiaIcon = () => <DynamicSvgIcon height={20} className="rounded-none" iconName="in" />
const CanadaIcon = () => <DynamicSvgIcon height={20} className="rounded-none" iconName="ca" />
const SecureCloudIcon = () => <DynamicSvgIcon height={20} className="rounded-none" iconName="secure-cloud" />
const CommunityCloudIcon = () => <DynamicSvgIcon height={20} className="rounded-none" iconName="community-cloud" />
const ShowAllIcon = () => <DynamicSvgIcon height={20} className="rounded-none" iconName="show-all" />
const ShowAvailableIcon = () => <DynamicSvgIcon height={20} className="rounded-none" iconName="show-available" />
const NvidiaLogo = () => <DynamicSvgIcon height={20} className="rounded-none" iconName="nvidia-logo" />
const VramLogo = () => <DynamicSvgIcon height={20} className="rounded-none" iconName="vram" />
const SocketLogo = () => <DynamicSvgIcon height={20} className="rounded-none" iconName="socket" />
const RightArrow = () => <DynamicSvgIcon height={20} className="rounded-none" iconName="rightArrow" />

const location: SelectItem[] = [
  { label: 'Any', name: 'any', image: <AnyIcon /> },
  { label: 'Africa', name: 'africa', image: <AfricaIcon /> },
  { label: 'South Asia', name: 'southAsia', image: <SouthAsiaIcon /> },
  { label: 'Canada', name: 'canada', image: <CanadaIcon /> }
]

const securityStandards: SelectItem[] = [
  { label: 'Any', name: 'any', image: <AnyIcon /> },
  { label: 'Secure Cloud', name: 'secureCloud', image: <SecureCloudIcon /> },
  { label: 'Community Cloud', name: 'communityCloud', image: <CommunityCloudIcon /> }
]

const availability: SelectItem[] = [
  { label: 'Show All', name: 'showAll', image: <ShowAllIcon /> },
  { label: 'Show Only Available', name: 'showOnlyAvailable', image: <ShowAvailableIcon /> }
]

const cpuNodes: SelectItem[] = [
  { label: 'CPU Node', name: 'cpuNode', image: <SocketLogo /> },
  { label: 'V100 (16GB)', name: 'v100', image: <NvidiaLogo /> },
  { label: 'RTX5000 ADA (20GB)', name: 'rtx5000ada', image: <NvidiaLogo /> }
]

const selectImages: SelectItem[] = [
  { label: 'Bittensor', name: 'bittensor', image: <NvidiaLogo /> },
  { label: 'Axolotl', name: 'axolotl', image: <NvidiaLogo /> }
]

const selectValue: SelectItem[] = [
  { label: '1', name: '1' },
  { label: '2', name: '2' },
  { label: '3', name: '3' },
  { label: '4', name: '4' },
  { label: '5', name: '5' }
]

const clusterBaseImages: ClusterBaseImage[] = [
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

const CreateCluster = () => {
  const { isResponsive } = useResize()
  const [modalopen, setModalopen] = useState(false)
  const [gpuCards, setGpuCards] = useState<any[]>([])
  const [selectedFlavors, setSelectedFlavors] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    const getGPUList = async () => {
      const gpuList = await getGPUAction()
      const imageList = await getImageAction()
      setGpuCards(gpuList.data.data)
      console.log('This is GPU list ==================>', gpuList)
      console.log('This is Image list ==================>', imageList)
    }
    getGPUList()
  }, [])

  const handleFlavorChange = (gpuKey: string, selectedFlavorId: string) => {
    console.log(gpuKey)
    setSelectedFlavors((prev) => ({
      ...prev,
      [gpuKey]: selectedFlavorId
    }))
  }

  const router = useRouter()
  return (
    <Flex className={styles.bg} direction="column">
      <Flex className={styles.header} p="4">
        <Flex justify="between" width="100%">
          <Flex direction="column">
            <div className={styles.headerTitle}>Create new GPU Cluster</div>
            <div className={styles.subTitle}>Choose your cluster for your GPU workload. Prices update in realtime.</div>
          </Flex>
          <Flex align="center" display={isResponsive ? 'none' : 'flex'}>
            <Button className={styles.headerButton}>
              <span>{'Select GPU First'}</span>
              <RightArrow />
            </Button>
          </Flex>
        </Flex>
      </Flex>

      <Flex p="4" direction={isResponsive ? 'column' : 'row'} gap="2">
        <Flex direction="column" mt="4" width={{ initial: '100%', sm: '100%', md: '25%' }} gap="2">
          <div className={styles.contentTitle}>Select Your GPU Type</div>
          <div className={styles.contentText}>Customize your cluster for optimal performance and scalability</div>
        </Flex>
        <Flex direction="column" mt="4" width={{ initial: '100%', sm: '100%', md: '75%' }}>
          {/* searchPad */}
          <TextField.Root placeholder="Search…" className={styles.searchPad}>
            <TextField.Slot className={styles.iconSlot}>
              <MagnifyingGlassIcon height="24" width="24" />
            </TextField.Slot>
          </TextField.Root>

          {/* Select Option */}
          <Flex mt="4" gap="2" direction={isResponsive ? 'column' : 'row'}>
            <FormSelect
              id="location"
              name="location"
              items={location}
              label="Location"
              defaultValue="any"
              className={styles.selectBox}
            />
            <FormSelect
              id="securityStandards"
              name="securityStandards"
              items={securityStandards}
              label="Security Standards"
              defaultValue="any"
              className={styles.selectBox}
            />
            <FormSelect
              id="availability"
              name="availability"
              items={availability}
              label="Availability"
              defaultValue="showAll"
              className={styles.selectBox}
            />
          </Flex>
          {/* GPU Cards */}
          <Flex mt="4" gap="2" direction={isResponsive ? 'column' : 'row'}>
            <Grid columns={{ initial: '1', sm: '1', md: '2', lg: '3' }} gap={{ initial: '2', sm: '4' }} width="100%">
              {/* card details */}
              {gpuCards.map((gpuCard, index) => {
                const gpuKey = `${gpuCard.gpu || 'cpu'}-${index}` // Unique key
                const flavorOptions: SelectItem[] = gpuCard.flavors.map((flavor: { name: any; id: any }) => ({
                  label: flavor.name, // Use flavor name as label
                  name: String(flavor.id) // Use flavor ID as value
                }))

                // Get selected flavor's CPU count
                const selectedFlavor = gpuCard.flavors.find(
                  (flavor: { id: any }) => String(flavor.id) === selectedFlavors[gpuKey]
                )
                const cpuCount = selectedFlavor ? selectedFlavor.cpu : gpuCard.flavors[0].cpu
                const ram = selectedFlavor ? selectedFlavor.ram : gpuCard.flavors[0].ram
                const disk = selectedFlavor ? selectedFlavor.disk : gpuCard.flavors[0].disk
                const ephemeral = selectedFlavor ? selectedFlavor.ephemeral : gpuCard.flavors[0].ephemeral
                const stock_available: boolean = selectedFlavor
                  ? selectedFlavor.stock_available
                  : gpuCard.flavors[0].stock_available

                return (
                  <Flex
                    className={styles.gpuCard}
                    key={`${gpuCard.gpu || 'cpu'}-${index}`}
                    direction="column"
                    gap="2"
                    justify="between"
                  >
                    <Flex className={styles.gpuCardContent} direction="column" gap="2">
                      <Flex width="100%" justify="between">
                        <Flex gap="2" className={styles.nvidiaTitle}>
                          <NvidiaLogo />
                          <div>{gpuCard.gpu || 'CPU only'}</div>
                        </Flex>
                      </Flex>

                      {/* FormSelect for flavors */}
                      <FormSelect
                        id={`flavor-${gpuCard.gpu || 'cpu'}-${index}`}
                        name="flavor"
                        items={flavorOptions}
                        defaultValue={`${flavorOptions[0].name}`}
                        onChange={(selectedValue) => handleFlavorChange(gpuKey, selectedValue)}
                        className={styles.selectValueBox}
                      />

                      <Flex width="100%" direction="column" p="1" className={styles.gpuStatus} gap="2">
                        <Flex align="center" gap="2">
                          <VramLogo />
                          <div className={styles.contentText}>CPUs:</div>
                          <div className={styles.contentTextWhite}>{cpuCount}</div>
                        </Flex>
                      </Flex>

                      <Flex width="100%" direction="column" p="1" className={styles.gpuStatus} gap="2">
                        <Flex align="center" gap="2">
                          <SocketLogo />
                          <div className={styles.contentText}>RAM:</div>
                          <div className={styles.contentTextWhite}>{ram} GB</div>
                        </Flex>
                      </Flex>

                      <Flex width="100%" direction="column" p="1" className={styles.gpuStatus} gap="2">
                        <Flex align="center" gap="2">
                          <SocketLogo />
                          <div className={styles.contentText}>Disk:</div>
                          <div className={styles.contentTextWhite}>{disk} GB</div>
                        </Flex>
                      </Flex>

                      {ephemeral > 0 && (
                        <Flex width="100%" direction="column" p="1" className={styles.gpuStatus} gap="2">
                          <Flex align="center" gap="2">
                            <SocketLogo />
                            <div className={styles.contentText}>Ephemeral:</div>
                            <div className={styles.contentTextWhite}>{ephemeral} GB</div>
                          </Flex>
                        </Flex>
                      )}
                    </Flex>

                    <Flex>
                      {stock_available ? (
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
              })}
            </Grid>
          </Flex>
        </Flex>
      </Flex>

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
              {/* cluster details */}
              {clusterBaseImages.map((clusterBaseImage) => (
                <Flex className={styles.clusterCard} key={clusterBaseImage.name} direction="column" gap="2">
                  <Flex width="100%" justify="between">
                    <Flex gap="2" className={styles.nvidiaTitle}>
                      <NvidiaLogo />
                      <div>{clusterBaseImage.name}</div>
                    </Flex>
                  </Flex>
                  <Flex width="100%" direction="column" p="1" className={styles.gpuStatus} gap="2">
                    <Flex align="center" gap="2">
                      <div className={styles.contentTextWhite}>{clusterBaseImage.description}</div>
                    </Flex>
                  </Flex>
                  <Flex width="100%" direction="column" p="1" className={styles.gpuStatus} gap="2">
                    <Flex align="center" gap="2">
                      <div className={styles.pathText}>{clusterBaseImage.path}</div>
                    </Flex>
                  </Flex>
                </Flex>
              ))}
            </Grid>
          </Flex>
          <Flex mt="4">
            <Button className={styles.selectGPUButton} onClick={() => setModalopen(true)}>
              Browse More Templates
            </Button>
          </Flex>
        </Flex>
      </Flex>

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
                  items={cpuNodes}
                  defaultValue="cpuNode"
                  className={styles.selectBox}
                />
              </Flex>
              <Flex width={{ initial: '33%' }}>
                <FormSelect
                  id="valueNumber"
                  name="valueNumber"
                  items={selectValue}
                  defaultValue="1"
                  className={styles.selectBox}
                />
              </Flex>
            </Flex>
            <Flex>
              <FormSelect
                id="location"
                name="location"
                items={location}
                label="Location"
                defaultValue="any"
                className={styles.selectBox}
              />
            </Flex>
            <Flex>
              <FormSelect
                id="securityStandards"
                name="securityStandards"
                items={securityStandards}
                label="Security Standards"
                defaultValue="any"
                className={styles.selectBox}
              />
            </Flex>
            <Flex>
              <FormSelect
                id="selectImages"
                name="selectImages"
                items={selectImages}
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
                <AnyIcon />
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

      <Dialog.Root open={modalopen} onOpenChange={setModalopen}>
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
                    {/* cluster details */}
                    {clusterBaseImages.map((clusterBaseImage) => (
                      <Flex className={styles.clusterCard} key={clusterBaseImage.name} direction="column" gap="2">
                        <Flex width="100%" justify="between">
                          <Flex gap="2" className={styles.nvidiaTitle}>
                            <NvidiaLogo />
                            <div>{clusterBaseImage.name}</div>
                          </Flex>
                        </Flex>
                        <Flex width="100%" direction="column" p="1" className={styles.gpuStatus} gap="2">
                          <Flex align="center" gap="2">
                            <div className={styles.contentTextWhite}>{clusterBaseImage.description}</div>
                          </Flex>
                        </Flex>
                        <Flex width="100%" direction="column" p="1" className={styles.gpuStatus} gap="2">
                          <Flex align="center" gap="2">
                            <div className={styles.pathText}>{clusterBaseImage.path}</div>
                          </Flex>
                        </Flex>
                      </Flex>
                    ))}
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
