'use client'
import React, { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Flex, Table, Button } from '@radix-ui/themes'
import MetricChart from '@/components/charts/Chart'
import DynamicSvgIcon from '@/components/icons/DynamicSvgIcon'
import ProgressBarCard from '@/components/progressBar/ProgressBar'
import { useResize } from '@/utils/Helper'
import NodeMaps from '../../../components/node-maps/NodeMaps'
import styles from './page.module.css'

interface ChartData {
  step: number
  value: number
  time: number
}

interface TableData {
  position: number
  contributor: string
  hours: string
  location: string
}

const DiscordIcon = () => <DynamicSvgIcon height={36} className="rounded-none" iconName="discord-logo" />
const GithubIcon = () => <DynamicSvgIcon height={32} className="rounded-none" iconName="github-logo" />
const HuggingFaceIcon = () => <DynamicSvgIcon height={32} className="rounded-none" iconName="hugging-face-logo" />
const GlobeIcon = () => <DynamicSvgIcon height={32} className="rounded-none" iconName="globe-icon" />
const ChatIcon = () => <DynamicSvgIcon height={26} className="rounded-none" iconName="chat-icon" />
const DialogCheck = () => <DynamicSvgIcon height={32} className="rounded-none" iconName="check-green-icon" />
const NavigateIcon = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="navigate-icon" />

const tempProgress = BigInt('1000000000000')
const tempChartData: ChartData[] = [
  {
    step: 1,
    value: 1,
    time: 1
  },
  {
    step: 2,
    value: 2,
    time: 2
  },
  {
    step: 3,
    value: 3,
    time: 3
  }
]

const tempNodes = [
  { id: '1', latitude: 90, longitude: 90 },
  { id: '2', latitude: 40, longitude: 40 },
  { id: '3', latitude: 10, longitude: 10 }
]

const tableHeader = ['POSITION', 'CONTRIBUTOR', 'HOURS CONTRIBUTED', 'LOCATION']

const tableData: TableData[] = [
  { position: 1, contributor: 'John Doe', hours: '12.3 H100 / hrs', location: 'San Mateo' },
  { position: 2, contributor: 'Jane Doe', hours: '13.3 H100 / hrs', location: 'San Mateo' },
  { position: 3, contributor: 'Jack Doe', hours: '14.3 H100 / hrs', location: 'San Mateo' },
  { position: 4, contributor: 'Alon Doe', hours: '15.3 H100 / hrs', location: 'San Mateo' }
]

const Clusters = () => {
  const { isResponsive } = useResize()
  const selectedMetrics = ['Loss', 'Perplexity', 'Tokens_per_second', 'Inner_lr']
  const [contributeModalOpen, setContributeModalOpen] = useState(false)
  const [currentDate, setCurrentDate] = useState<string>('')

  useEffect(() => {
    const date = new Date().toISOString().replace('T', ' ').slice(0, 19)
    setCurrentDate(date)
  }, [])

  return (
    <Flex className={styles.bg} direction="column">
      <Flex className={styles.header} p="4">
        <Flex justify="between" gap="6" direction={isResponsive ? 'column' : 'row'}>
          <Flex direction="column">
            <div className={styles.headerTitle}>INTELLECT-1</div>
            <div className={styles.subTitle}>
              INTELLECT-1 is the world&apos;s first decentralized training of a 10B parameter model, enabling anyone to
              contribute compute and participate. The model is based on the Llama-3 architecture. The weights,
              intermediate checkpoints, and full training dataset will be released before the end of November.
            </div>
          </Flex>
          <Flex gap="2" align="center" direction={isResponsive ? 'column' : 'row'}>
            <Flex gap="4" align="center">
              <div className={styles.iconButton}>
                <DiscordIcon />
              </div>
              <div className={styles.iconButton}>
                <GithubIcon />
              </div>
              <div className={styles.iconButton}>
                <HuggingFaceIcon />
              </div>
              <div className={styles.iconButton}>
                <GlobeIcon />
              </div>
            </Flex>
            <Flex direction={isResponsive ? 'column' : 'row'} gap="2" width="100%">
              <Button className={styles.defaultButton} onClick={() => setContributeModalOpen(true)}>
                Contribute Complete
              </Button>
              <Button className={styles.confirmButton}>
                <ChatIcon />
                chat.avaxGPUs.ai
              </Button>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
      <Flex p="4" gap="4" direction={isResponsive ? 'column' : 'row'}>
        <Flex direction="column" gap="4" width={isResponsive ? '100%' : '50%'}>
          <ProgressBarCard
            title="Training Completed"
            current={Number(tempProgress)}
            total={tempProgress}
            unit="tokens"
          />
          <Flex gap="2">
            <div className="flex flex-col flex-grow justify-start w-full h-full mb-auto">
              <div className="flex flex-col w-full h-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                  {selectedMetrics.map((metric) => (
                    <MetricChart
                      key={metric}
                      data={tempChartData}
                      metricName={metric}
                      decimalPlaces={
                        {
                          loss: 3,
                          perplexity: 2,
                          tokens_per_second: 1,
                          inner_lr: 1
                        }[metric] ?? 1
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
          </Flex>
          <Flex align="start" gap="2" justify="between" direction={isResponsive ? 'column' : 'row'}>
            <Flex gap="1" align="center">
              <div className="w-2 h-2 rounded-full mr-2 bg-[#5BC93B]"></div>
              <Flex className={styles.subTitle}>You are now connected from</Flex>
              <Flex className={styles.subText}>Croatia</Flex>
            </Flex>
            <Flex className={styles.subText}>{currentDate}</Flex>
          </Flex>
        </Flex>
        <Flex direction="column" gap="0" width={isResponsive ? '100%' : '50%'}>
          <NodeMaps nodes={tempNodes} />
          <Flex direction="column" gap="0">
            <Flex className={styles.tableHeaderPad} p="3">
              Leaderboard (30)
            </Flex>
            {tableData.length > 0 && (
              <Table.Root className={styles.historyTable}>
                <Table.Header>
                  <Table.Row className={styles.historyTableHeader}>
                    {tableHeader.map((item) => (
                      <Table.ColumnHeaderCell key={item}>
                        <Flex align="center" gap="2" className={styles.historyTableHeaderCell}>
                          {item}
                        </Flex>
                      </Table.ColumnHeaderCell>
                    ))}
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {tableData &&
                    tableData.map((data: TableData) => (
                      <Table.Row key={data.position}>
                        <Table.Cell className={styles.historyTableCell}>{data.position}</Table.Cell>
                        <Table.Cell className={styles.historyTableCell}>{data.contributor}</Table.Cell>
                        <Table.Cell className={styles.historyTableCell}>{data.hours}</Table.Cell>
                        <Table.Cell className={styles.historyTableCell}>{data.location}</Table.Cell>
                      </Table.Row>
                    ))}
                </Table.Body>
              </Table.Root>
            )}
          </Flex>
        </Flex>
      </Flex>

      {/* dialog */}
      <Dialog.Root open={contributeModalOpen} onOpenChange={setContributeModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.dialogOverlay} />
          <Dialog.Content className={styles.dialogContent}>
            <Dialog.Title />
            <Flex direction="column">
              <Flex className={styles.modalTitle}>Contribute Compute to INTELLECT-1</Flex>

              <Flex className={styles.modalText} mt="10px" mb="20px">
                Rent and contribute compute to the decentralized training of frontier models.
              </Flex>
              <Flex className={styles.modalBody} direction="column" gap="20px">
                <Flex>
                  <Flex>
                    <div className="absolute left-[0.6em] flex h-6 w-6 items-center justify-center rounded-full bg-white">
                      <div className="font-semibold text-slate-800">1</div>
                    </div>
                  </Flex>
                  <Flex direction="column" ml="30px" gap="5px">
                    <Flex className={styles.modalTitle}>Select GPUs and Image</Flex>
                    <Flex className={styles.subTitle}>
                      Select the training run image, INTELLECT-1 and specific GPUs to rent.
                    </Flex>
                    <Flex width="200px" mt="20px">
                      <Button className={styles.modalButton}>
                        View Documentation
                        <NavigateIcon />
                      </Button>
                    </Flex>
                  </Flex>
                </Flex>

                <Flex>
                  <Flex>
                    <div className="absolute left-[0.6em] flex h-6 w-6 items-center justify-center rounded-full bg-white">
                      <div className="font-semibold text-slate-800">2</div>
                    </div>
                  </Flex>
                  <Flex direction="column" ml="30px" gap="5px">
                    <Flex className={styles.modalTitle}>Rent & Deploy GPUs</Flex>
                    <Flex className={styles.subTitle}>
                      Deploying GPUs will provision the compute and automatically connect you to the training run. Note
                      that you will be billed for the compute you rent.
                    </Flex>
                  </Flex>
                </Flex>

                <Flex>
                  <Flex>
                    <div className="absolute left-[0.6em] flex h-6 w-6 items-center justify-center rounded-full bg-white">
                      <div className="font-semibold text-slate-800">3</div>
                    </div>
                  </Flex>
                  <Flex direction="column" ml="30px" gap="5px">
                    <Flex className={styles.modalTitle}>Track Progress & Contributions</Flex>
                    <Flex className={styles.subTitle}>
                      Monitor your contributions on the dashboard. Your name and profile picture will be visible on the
                      leaderboard and map. You can edit your profile in settings.
                    </Flex>
                  </Flex>
                </Flex>
              </Flex>
              <Flex width="100%" mt="20px">
                <div className="rounded px-4 py-3 shadow-md border-l-4 border-teal-500 bg-teal-100 text-teal-900 w-full">
                  <Flex width="100%">
                    <DialogCheck />
                    <Flex direction="column" gap="2">
                      <Flex className={styles.cardText}>Training has completed</Flex>
                      <Flex className={styles.cardContent}>
                        The training run has completed, and is no longer accepting contributions.
                      </Flex>
                    </Flex>
                  </Flex>
                </div>
              </Flex>

              <Flex direction="column" mt="20px" gap="10px">
                <Button className={styles.modalButton} onClick={() => setContributeModalOpen(false)}>
                  Get notified of future training runs
                </Button>
                <Button className={styles.modalButtonSignup}>Sign up to contribute my own compute</Button>
              </Flex>
            </Flex>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Flex>
  )
}

export default Clusters
