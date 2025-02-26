'use client'

import React, { useEffect } from 'react'
import * as Progress from '@radix-ui/react-progress'
import * as Switch from '@radix-ui/react-switch'
import { Flex } from '@radix-ui/themes'
import { Breadcrumb } from '@/components/breadCrumbs/BreadCrumb'
import DynamicSvgIcon from '@/components/icons/DynamicSvgIcon'
import { FormSelect, SelectItem } from '@/components/select/FormSelect'
import { useResize } from '@/utils/Helper'
import styles from './page.module.css'

const WhiteCheckIcon = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="whiteCheck" />
const AnyIcon = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="any" />
const AfricaIcon = () => <DynamicSvgIcon height={20} className="rounded-none" iconName="za" />
const SouthAsiaIcon = () => <DynamicSvgIcon height={20} className="rounded-none" iconName="in" />
const CanadaIcon = () => <DynamicSvgIcon height={20} className="rounded-none" iconName="ca" />
const SecureCloudIcon = () => <DynamicSvgIcon height={20} className="rounded-none" iconName="secure-cloud" />
const CommunityCloudIcon = () => <DynamicSvgIcon height={20} className="rounded-none" iconName="community-cloud" />
const NvidiaLogo = () => <DynamicSvgIcon height={20} className="rounded-none" iconName="nvidia-logo" />
const SocketLogo = () => <DynamicSvgIcon height={20} className="rounded-none" iconName="socket" />
const LargeSocketLogo = () => <DynamicSvgIcon height={50} className="rounded-none" iconName="socket" />

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

const Search = () => {
  const [progress, setProgress] = React.useState(0)
  const { isResponsive } = useResize()

  useEffect(() => {
    const timer = setTimeout(() => setProgress(100), 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <Flex className={styles.bg} direction="column">
      <Flex className={styles.header} p="4">
        <Flex justify="between">
          <Flex direction="column">
            <Breadcrumb
              items={[{ name: 'Overview', href: '/dashboard/create-cluster' }, { name: 'Search Clusters' }]}
            />
            <div className={styles.subTitle}>Manage your active instance and review your instances history.</div>
          </Flex>
        </Flex>
      </Flex>
      <Flex p="4" gap="2" direction="column">
        <Flex justify="between" width="100%">
          <Flex>
            <WhiteCheckIcon />
            <div>17 out of 17 Providers compared</div>
          </Flex>
          <Flex>
            <div>Sorted by cheapest</div>
          </Flex>
        </Flex>
        <Flex>
          <Progress.Root className={styles.progressRoot} value={progress}>
            <Progress.Indicator className={styles.progressIndicator} style={{ width: `${progress}%` }} />
          </Progress.Root>
        </Flex>
      </Flex>

      <Flex direction={isResponsive ? 'column' : 'row'} gap="4">
        {/* summary section */}
        <Flex p="4" direction="column" mt="4" width={{ initial: '100%', sm: '100%', md: '35%' }}>
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
        </Flex>

        {/* matching Instance section */}
        <Flex
          direction="column"
          gap="2"
          justify="center"
          align="center"
          width={{ initial: '100%', sm: '100%', md: '65%' }}
          mb="4"
        >
          <LargeSocketLogo />
          <div>No Matching Instances</div>
          <div className={styles.contentText}>
            Try adjusting your filters or check back later for updated availability.
          </div>
        </Flex>
      </Flex>
    </Flex>
  )
}

export default Search
