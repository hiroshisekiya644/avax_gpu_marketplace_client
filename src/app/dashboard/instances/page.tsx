'use client'
import React, { useState } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { Flex, Button, Table } from '@radix-ui/themes'
import { useRouter } from 'next/navigation'
import DynamicSvgIcon from '@/components/icons/DynamicSvgIcon'
import styles from './page.module.css'

type DummyTableData = {
  gpu: string
  provider: string
  creationDate: string
  terminationDate: string
  averagePrice: string
  totalBilledPrice: string
}

const StartIcon = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="start-icon" />
const DeleteIcon = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="delete-icon" />

type TabValue = 'instances' | 'history'
const tabValues: TabValue[] = ['instances', 'history']
const tabListItems = [
  { name: 'Instances', icon: <StartIcon />, value: 'instances' },
  { name: 'History', icon: <DeleteIcon />, value: 'history' }
]

const tableHeaderItems = ['GPU', 'PROVIDER', 'CREATION DATE', 'TERMINATION DATE', 'AVERAGE PRICE', 'TOTAL BILLED PRICE']

const dummyTableData: DummyTableData[] = [
  {
    gpu: '123',
    provider: 'John DOE',
    creationDate: '2024-01-01',
    terminationDate: '2024-01-02',
    averagePrice: '$2.11',
    totalBilledPrice: '$33.42'
  },
  {
    gpu: '124',
    provider: 'John DOE',
    creationDate: '2024-02-01',
    terminationDate: '2024-01-02',
    averagePrice: '$2.11',
    totalBilledPrice: '$33.42'
  },
  {
    gpu: '125',
    provider: 'Joe Biden',
    creationDate: '2024-03-01',
    terminationDate: '2024-01-02',
    averagePrice: '$12.11',
    totalBilledPrice: '$323.42'
  }
]

const Instances = () => {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabValue>(tabValues[0])
  const handleTabChange = (value: TabValue) => {
    setActiveTab(value)
  }

  return (
    <Flex className={styles.bg} direction="column">
      <Flex className={styles.header} p="4">
        <Flex justify="between">
          <Flex direction="column">
            <div className={styles.headerTitle}>Instances</div>
            <div className={styles.subTitle}>Manage your active instance and review your instances history.</div>
          </Flex>
        </Flex>
      </Flex>
      <Flex p="4">
        <Flex width="100%">
          <Tabs.Root
            value={activeTab}
            defaultValue="top"
            className={styles.wrapper}
            onValueChange={(value) => handleTabChange(value as TabValue)}
          >
            <Tabs.List className={styles.tabList}>
              {tabListItems.map((tabListItem, i) => (
                <Tabs.Trigger key={i} value={tabListItem.value} className={styles.tabListItem}>
                  <Flex gap="1">
                    {tabListItem.icon}
                    {tabListItem.name}
                  </Flex>
                </Tabs.Trigger>
              ))}
            </Tabs.List>
            <Tabs.Content value="instances" className={styles.tabContent}>
              <Flex
                mt="8"
                p="8"
                direction="column"
                gap="10px"
                justify="center"
                width="100%"
                align="center"
                className={styles.instanceCardWrapper}
              >
                <div className={styles.instanceTitle}>No running instances</div>
                <div className={styles.instanceContent}>Deploy a new GPU cluster below.</div>
                <Button className={styles.instanceButton} onClick={() => router.push('/dashboard/create-cluster')}>
                  Configure & Deploy GPU
                </Button>
              </Flex>
            </Tabs.Content>
            <Tabs.Content value="history" className={styles.tabContent}>
              <Flex
                p="2"
                mt="8"
                direction="column"
                gap="10px"
                justify="center"
                width="100%"
                align="center"
                className={styles.instanceCardWrapper}
              >
                {dummyTableData.length > 0 ? (
                  <Table.Root className={styles.historyTable}>
                    <Table.Header>
                      <Table.Row className={styles.historyTableHeader}>
                        {tableHeaderItems.map((item) => (
                          <Table.ColumnHeaderCell key={item}>
                            <Flex align="center" gap="2" className={styles.historyTableCell}>
                              {item}
                            </Flex>
                          </Table.ColumnHeaderCell>
                        ))}
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {dummyTableData &&
                        dummyTableData.map((data: DummyTableData) => (
                          <Table.Row key={data.gpu}>
                            <Table.Cell className={styles.historyTableCell}>{data.gpu}</Table.Cell>
                            <Table.Cell className={styles.historyTableCell}>{data.provider}</Table.Cell>
                            <Table.Cell className={styles.historyTableCell}>{data.creationDate}</Table.Cell>
                            <Table.Cell className={styles.historyTableCell}>{data.terminationDate}</Table.Cell>
                            <Table.Cell className={styles.historyTableCell}>{data.averagePrice}</Table.Cell>
                            <Table.Cell className={styles.historyTableCell}>{data.totalBilledPrice}</Table.Cell>
                          </Table.Row>
                        ))}
                    </Table.Body>
                  </Table.Root>
                ) : (
                  <Flex
                    mt="8"
                    p="8"
                    direction="column"
                    gap="10px"
                    justify="center"
                    width="100%"
                    align="center"
                    className={styles.instanceCardWrapper}
                  >
                    <div className={styles.instanceTitle}>No Data</div>
                    <div className={styles.instanceContent}>You didn&apos;t terminate any pods yet.</div>
                  </Flex>
                )}
              </Flex>
            </Tabs.Content>
          </Tabs.Root>
        </Flex>
      </Flex>
    </Flex>
  )
}

export default Instances
