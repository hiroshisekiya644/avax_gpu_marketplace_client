"use client"

import { useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { Flex, Button } from "@radix-ui/themes"
import DynamicSvgIcon from "@/components/icons/DynamicSvgIcon"
import { FormSelect, type SelectItem } from "@/components/select/FormSelect"
import { Snackbar } from "@/components/snackbar/SnackBar"
import { useResize } from "@/utils/Helper"
import styles from "./page.module.css"
import { useRouter } from "next/navigation"

const AnyIcon = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="any" />
const CanadaIcon = () => <DynamicSvgIcon height={20} className="rounded-none" iconName="ca" />
const NvidiaLogo = () => <DynamicSvgIcon height={20} className="rounded-none" iconName="nvidia-logo" />
const SocketLogo = () => <DynamicSvgIcon height={24} className="rounded-none" iconName="socket" />
const CheapIcon = () => <DynamicSvgIcon height={20} className="rounded-none" iconName="cheap-icon" />
const SecureCloudIcon = () => <DynamicSvgIcon height={20} className="rounded-none" iconName="secure-cloud" />
const LighteningIcon = () => <DynamicSvgIcon height={20} className="rounded-none" iconName="lightening-icon" />
const DiskSizeIcon = () => <DynamicSvgIcon height={24} className="rounded-none" iconName="disksize-icon" />
const LocationIcon = () => <DynamicSvgIcon height={24} className="rounded-none" iconName="location-icon" />

const location: SelectItem[] = [{ label: "Canada", name: "canada", image: <CanadaIcon /> }]
const cpuNodes: SelectItem[] = [{ label: "V100 (16GB)", name: "v100", image: <NvidiaLogo /> }]
const selectImages: SelectItem[] = [{ label: "Ubuntu 22", name: "ubuntu22", image: <NvidiaLogo /> }]

const selectValue: SelectItem[] = [
  { label: "8", name: "8" },
  { label: "16", name: "16" },
  { label: "32", name: "32" },
  { label: "64", name: "64" },
  { label: "128", name: "128" },
  { label: "256 - contact us", name: "256", disabled: true },
  { label: "512 - contact us", name: "512", disabled: true },
]

const Clusters = () => {
  const { isResponsive } = useResize()
  const [modalopen, setModalopen] = useState(false)
  const router = useRouter()

  const handleSubmit = () => {
    Snackbar({ message: "You have successfully deployed." })
    setModalopen(false)
  }

  return (
    <Flex className={styles.bg} direction="column">
      <Flex className={styles.header} p="4">
        <Flex justify="between">
          <Flex direction="column">
            <div className={styles.headerTitle}>Create a Multi-Node Cluster</div>
            <div className={styles.subTitle}>
              Get instant access to your on-demand multi-node H100 training cluster.
            </div>
          </Flex>
        </Flex>
      </Flex>
      <Flex p="4" direction={isResponsive ? "column" : "row"} gap="2">
        <Flex direction="column" width={{ initial: "100%", sm: "100%", md: "35%" }} gap="2">
          <Flex direction="column" width={{ initial: "100%", sm: "100%" }}>
            <Flex className={styles.summary} p="4" gap="2" direction="column">
              <Flex gap="2">
                <Flex width={{ initial: "66%" }}>
                  <FormSelect
                    id="cpuNode"
                    name="cpuNode"
                    items={cpuNodes}
                    defaultValue="v100"
                    className={styles.selectBox}
                  />
                </Flex>
                <Flex width={{ initial: "33%" }}>
                  <FormSelect
                    id="valueNumber"
                    name="valueNumber"
                    items={selectValue}
                    defaultValue="8"
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
                  defaultValue="canada"
                  className={styles.selectBox}
                  disabled
                />
              </Flex>
              <Flex>
                <FormSelect
                  id="selectImages"
                  name="selectImages"
                  items={selectImages}
                  label="Image"
                  defaultValue="ubuntu22"
                  className={styles.selectBox}
                />
              </Flex>
              <Flex justify="between" align="center" className={styles.instanceArea} p="4">
                <Flex gap="2">
                  <AnyIcon />
                  <div className={styles.priceTitle}>Lowest Price Per GPU</div>
                </Flex>
                <Flex direction="column">
                  <div className={styles.priceTitle}>$2.55/hr</div>
                  <div className={styles.contentText}>$61.20 per day</div>
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
        <Flex direction="column" width={{ initial: "100%", sm: "100%", md: "65%" }} gap="4">
          <Flex className={styles.cardSummary} p="4" gap="2" direction="column">
            <Flex justify="between" direction={isResponsive ? "column" : "row"}>
              <div className={styles.cardHeaderTitle}>H100 80GB x 16</div>
              <Flex align="center">
                <span className={styles.curlIcon}>~</span>
                <span className={styles.cardPrice}>$40.80&nbsp;</span>
                <span className={styles.subTitle}>usd/hr</span>
              </Flex>
            </Flex>

            <Flex direction="column" gap="1">
              <Flex gap="2" direction={isResponsive ? "column" : "row"}>
                <Flex align="center" className={styles.sxm5Card} p="5px">
                  SXM5
                </Flex>
                <Flex align="center" p="5px" className={styles.secureCloudCard}>
                  <SecureCloudIcon />
                  SECURE_CLOUD
                </Flex>
                <Flex align="center" p="5px" className={styles.ethernetCard}>
                  100Gbps ETHERNET
                </Flex>
                <Flex align="center" p="5px" className={styles.cheapCard}>
                  <CheapIcon />
                  CHEAPEST CLUSTER
                </Flex>
              </Flex>
            </Flex>
            <Flex gap="4" mt="2" className={styles.instanceArea} p="4" direction={isResponsive ? "column" : "row"}>
              <Flex direction="column" gap="2" width={{ initial: "100%", sm: "100%", md: "35%" }}>
                <Flex align="center" gap="1">
                  <SocketLogo /> <Flex className={styles.subTitle}>CPU (per node)</Flex>
                </Flex>
                <Flex justify="between" className={styles.cardInputDisabled} p="2">
                  <Flex className={styles.subTitle}>104</Flex>
                  <Flex className={styles.subTitle}>CPU</Flex>
                </Flex>
              </Flex>

              <Flex direction="column" gap="2" width={{ initial: "100%", sm: "100%", md: "35%" }}>
                <Flex align="center" gap="1">
                  <DiskSizeIcon /> <Flex className={styles.subTitle}>Disk size (per node)</Flex>
                </Flex>
                <Flex justify="between" className={styles.cardInputDisabled} p="2">
                  <Flex className={styles.subTitle}>12000</Flex>
                  <Flex className={styles.subTitle}>GB</Flex>
                </Flex>
              </Flex>
            </Flex>

            <Flex gap="2" mt="2" className={styles.instanceArea} p="4" justify="between">
              <Flex align="center" gap="1">
                <LocationIcon />
                <div className={styles.cardLabel}>Location</div>
              </Flex>
              <Flex align="center" gap="1">
                <CanadaIcon />
                <div className={styles.cardLabel}>Canada</div>
              </Flex>
            </Flex>
            <Flex>
              <Flex className={styles.subTitle}>Spin up time: ~30 minutes</Flex>
            </Flex>
            <Flex mt="2" width="100%">
              <Button className={styles.deployButton} onClick={() => router.push("/dashboard/create-cluster")}>
                <SocketLogo /> Deploy Cluster
              </Button>
            </Flex>
          </Flex>

          <Flex className={styles.cardSummary} p="4" gap="2" direction="column">
            <Flex justify="between" direction={isResponsive ? "column" : "row"}>
              <div className={styles.cardHeaderTitle}>H100 80GB x 16</div>
              <Flex align="center">
                <span className={styles.curlIcon}>~</span>
                <span className={styles.cardPrice}>$52.80&nbsp;</span>
                <span className={styles.subTitle}>usd/hr</span>
              </Flex>
            </Flex>

            <Flex direction="column" gap="1">
              <Flex gap="2" direction={isResponsive ? "column" : "row"}>
                <Flex align="center" className={styles.sxm5Card} p="5px">
                  SXM5
                </Flex>
                <Flex align="center" p="5px" className={styles.secureCloudCard}>
                  <SecureCloudIcon />
                  SECURE_CLOUD
                </Flex>
                <Flex align="center" p="5px" className={styles.sxm5Card}>
                  <LighteningIcon />
                  3.2Tbps INFINIBAND
                </Flex>
              </Flex>
            </Flex>
            <Flex gap="4" mt="2" className={styles.instanceArea} p="4" direction={isResponsive ? "column" : "row"}>
              <Flex direction="column" gap="2" width={{ initial: "100%", sm: "100%", md: "35%" }}>
                <Flex align="center" gap="1">
                  <SocketLogo /> <Flex className={styles.subTitle}>CPU (per node)</Flex>
                </Flex>
                <Flex justify="between" className={styles.cardInputDisabled} p="2">
                  <Flex className={styles.subTitle}>104</Flex>
                  <Flex className={styles.subTitle}>CPU</Flex>
                </Flex>
              </Flex>

              <Flex direction="column" gap="2" width={{ initial: "100%", sm: "100%", md: "35%" }}>
                <Flex align="center" gap="1">
                  <DiskSizeIcon /> <Flex className={styles.subTitle}>Disk size (per node)</Flex>
                </Flex>
                <Flex justify="between" className={styles.cardInputDisabled} p="2">
                  <Flex className={styles.subTitle}>16000</Flex>
                  <Flex className={styles.subTitle}>GB</Flex>
                </Flex>
              </Flex>
            </Flex>

            <Flex gap="2" mt="2" className={styles.instanceArea} p="4" justify="between">
              <Flex align="center" gap="1">
                <LocationIcon />
                <div className={styles.cardLabel}>Location</div>
              </Flex>
              <Flex align="center" gap="1">
                <CanadaIcon />
                <div className={styles.cardLabel}>Canada</div>
              </Flex>
            </Flex>
            <Flex>
              <Flex className={styles.subTitle}>Spin up time: ~30 minutes</Flex>
            </Flex>
            <Flex mt="2" width="100%">
              <Button className={styles.deployButton} onClick={() => setModalopen(true)}>
                <SocketLogo /> Deploy Cluster
              </Button>
            </Flex>
          </Flex>
        </Flex>
      </Flex>

      <Dialog.Root open={modalopen} onOpenChange={setModalopen}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.dialogOverlay} />
          <Dialog.Content className={styles.dialogContent}>
            <Dialog.Title />
            <Flex direction="column">
              <Flex>Pre-paid instance</Flex>
              <Flex className={styles.contentText} mt="10px" mb="10px">
                You’ve selected an instance that requires a minimum commitment of 2 hours. You’ll be charged upfront for
                this duration at 40.80/hour. After your prepaid hours are consumed, the standard hourly rate will apply
                for any additional usage. This helps us ensure reliable access to high-demand GPUs for your tasks.
              </Flex>
              <Flex ml="auto" mt="10px" gap="4">
                <Button className={styles.defaultButton} onClick={() => setModalopen(false)}>
                  Cancel
                </Button>
                <Button className={styles.confirmButton} onClick={handleSubmit}>
                  Confirm
                </Button>
              </Flex>
            </Flex>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Flex>
  )
}

export default Clusters

