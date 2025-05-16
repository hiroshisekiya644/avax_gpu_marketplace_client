'use client'

import { useState, useEffect, useCallback } from 'react'
import { Flex, Button } from '@radix-ui/themes'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { getGpuAction } from '@/api/GpuProvider'
import DynamicSvgIcon from '@/components/icons/DynamicSvgIcon'
import { Snackbar } from '@/components/snackbar/SnackBar'
import styles from './page.module.css'

// Icons
const BackIcon = () => <DynamicSvgIcon height={18} className="rounded-none" iconName="left-arrow" />
const FirewallIcon = () => <DynamicSvgIcon height={18} className="rounded-none" iconName="firewall-icon" />
const SSHIcon = () => <DynamicSvgIcon height={16} className="rounded-none" iconName="terminal-icon" />
const PingIcon = () => <DynamicSvgIcon height={16} className="rounded-none" iconName="activity-icon" />
const InboundIcon = () => <DynamicSvgIcon height={16} className="rounded-none" iconName="download-icon" />
const OutboundIcon = () => <DynamicSvgIcon height={16} className="rounded-none" iconName="upload-icon" />
const AddIcon = () => <DynamicSvgIcon height={16} className="rounded-none" iconName="pluscircle-icon" />
const DeleteIcon = () => <DynamicSvgIcon height={16} className="rounded-none" iconName="trash-icon" />
const NetworkIcon = () => <DynamicSvgIcon height={16} className="rounded-none" iconName="network-icon" />
const OverviewIcon = () => <DynamicSvgIcon height={16} className="rounded-none" iconName="overview-icon" />
const ToolIcon = () => <DynamicSvgIcon height={16} className="rounded-none" iconName="tool-icon" />
const SettingIcon = () => <DynamicSvgIcon height={16} className="rounded-none" iconName="settings-icon" />
const LockIcon = () => <DynamicSvgIcon height={16} className="rounded-none" iconName="lock-icon" />
const ActivityIcon = () => <DynamicSvgIcon height={16} className="rounded-none" iconName="activity-icon" />
const GlobeIcon = () => <DynamicSvgIcon height={16} className="rounded-none" iconName="globe-icon" />
const InboxIcon = () => <DynamicSvgIcon height={16} className="rounded-none" iconName="inbox" />
const MonitorIcon = () => <DynamicSvgIcon height={16} className="rounded-none" iconName="monitor-icon" />
const KeyIcon = () => <DynamicSvgIcon height={16} className="rounded-none" iconName="key-icon" />

// Define the flavor features interface
interface FlavorFeatures {
  network_optimised: boolean
  no_hibernation: boolean
  no_snapshot: boolean
  local_storage_only: boolean
}

// Define the GPU instance type based on the API response
interface GpuInstance {
  id: number
  user_id: number
  flavor_name: string
  region: string
  instance_id: number | string
  gpu_name: string
  hyperstack_gpu_name: string
  status: string
  flavor_features: FlavorFeatures
  startedAt: string
  is_deleted: boolean
  deleted_at: string | null
  createdAt: string
  updatedAt: string
  public_ip?: string | null
}

// Define rule interface
interface FirewallRule {
  id: string
  direction: 'inbound' | 'outbound'
  protocol: 'tcp' | 'udp' | 'icmp'
  port_range: string
  source: string
  description: string
}

// Mock data for demonstration
const mockInboundRules: FirewallRule[] = [
  {
    id: 'in-1',
    direction: 'inbound',
    protocol: 'tcp',
    port_range: '22',
    source: '0.0.0.0/0',
    description: 'SSH Access'
  },
  {
    id: 'in-2',
    direction: 'inbound',
    protocol: 'tcp',
    port_range: '80',
    source: '0.0.0.0/0',
    description: 'HTTP'
  },
  {
    id: 'in-3',
    direction: 'inbound',
    protocol: 'tcp',
    port_range: '443',
    source: '0.0.0.0/0',
    description: 'HTTPS'
  }
]

const mockOutboundRules: FirewallRule[] = [
  {
    id: 'out-1',
    direction: 'outbound',
    protocol: 'tcp',
    port_range: '1-65535',
    source: '0.0.0.0/0',
    description: 'All TCP Traffic'
  },
  {
    id: 'out-2',
    direction: 'outbound',
    protocol: 'udp',
    port_range: '1-65535',
    source: '0.0.0.0/0',
    description: 'All UDP Traffic'
  }
]

const FirewallPage = () => {
  const router = useRouter()
  const params = useParams()
  const vmId = params?.vmId as string

  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [instance, setInstance] = useState<GpuInstance | null>(null)

  // Firewall settings
  const [sshEnabled, setSSHEnabled] = useState<boolean>(true)
  const [icmpEnabled, setICMPEnabled] = useState<boolean>(true)
  const [inboundRules, setInboundRules] = useState<FirewallRule[]>([])
  const [outboundRules, setOutboundRules] = useState<FirewallRule[]>([])

  // Form states for adding new rules
  const [newInboundRule, setNewInboundRule] = useState({
    protocol: 'tcp',
    port_range: '',
    source: '',
    description: ''
  })

  const [newOutboundRule, setNewOutboundRule] = useState({
    protocol: 'tcp',
    port_range: '',
    source: '',
    description: ''
  })

  // Fetch instance data
  const fetchInstanceData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await getGpuAction()

      if (response && response.status === 'success') {
        // Handle both array and single object responses
        const gpuData = Array.isArray(response.gpu) ? response.gpu : [response.gpu]

        // Find the specific instance by ID
        const foundInstance = gpuData.find(
          (inst) => inst.id.toString() === vmId || inst.instance_id.toString() === vmId
        )

        if (foundInstance) {
          // Process the data to convert BUILD status to CREATING
          const processedInstance = {
            ...foundInstance,
            status: foundInstance.status === 'BUILD' ? 'CREATING' : foundInstance.status
          }

          setInstance(processedInstance)

          // Set mock firewall data
          setInboundRules(mockInboundRules)
          setOutboundRules(mockOutboundRules)
        } else {
          setError('Instance not found')
        }
      } else {
        setError('Failed to fetch instance details')
      }
    } catch (err) {
      console.error('Error fetching instance details:', err)
      setError('Failed to fetch instance details. Please try again.')
      Snackbar({ message: 'Failed to fetch instance details', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }, [vmId])

  // Handle toggle changes
  const handleToggleSSH = () => {
    setSSHEnabled(!sshEnabled)
    // In a real implementation, this would call an API to update the setting
    Snackbar({
      message: `SSH access ${!sshEnabled ? 'enabled' : 'disabled'}`,
      type: 'success'
    })
  }

  const handleToggleICMP = () => {
    setICMPEnabled(!icmpEnabled)
    // In a real implementation, this would call an API to update the setting
    Snackbar({
      message: `ICMP (ping) access ${!icmpEnabled ? 'enabled' : 'disabled'}`,
      type: 'success'
    })
  }

  // Handle adding new inbound rule
  const handleAddInboundRule = () => {
    if (!newInboundRule.port_range || !newInboundRule.source) {
      Snackbar({ message: 'Please fill in all required fields', type: 'error' })
      return
    }

    const newRule: FirewallRule = {
      id: `in-${Date.now()}`,
      direction: 'inbound',
      protocol: newInboundRule.protocol as 'tcp' | 'udp' | 'icmp',
      port_range: newInboundRule.port_range,
      source: newInboundRule.source,
      description: newInboundRule.description
    }

    setInboundRules([...inboundRules, newRule])

    // Reset form
    setNewInboundRule({
      protocol: 'tcp',
      port_range: '',
      source: '',
      description: ''
    })

    Snackbar({ message: 'Inbound rule added successfully', type: 'success' })
  }

  // Handle adding new outbound rule
  const handleAddOutboundRule = () => {
    if (!newOutboundRule.port_range || !newOutboundRule.source) {
      Snackbar({ message: 'Please fill in all required fields', type: 'error' })
      return
    }

    const newRule: FirewallRule = {
      id: `out-${Date.now()}`,
      direction: 'outbound',
      protocol: newOutboundRule.protocol as 'tcp' | 'udp' | 'icmp',
      port_range: newOutboundRule.port_range,
      source: newOutboundRule.source,
      description: newOutboundRule.description
    }

    setOutboundRules([...outboundRules, newRule])

    // Reset form
    setNewOutboundRule({
      protocol: 'tcp',
      port_range: '',
      source: '',
      description: ''
    })

    Snackbar({ message: 'Outbound rule added successfully', type: 'success' })
  }

  // Handle deleting a rule
  const handleDeleteRule = (id: string, direction: 'inbound' | 'outbound') => {
    if (direction === 'inbound') {
      setInboundRules(inboundRules.filter((rule) => rule.id !== id))
    } else {
      setOutboundRules(outboundRules.filter((rule) => rule.id !== id))
    }

    Snackbar({ message: 'Rule deleted successfully', type: 'success' })
  }

  // Get protocol badge class
  const getProtocolBadgeClass = (protocol: string) => {
    switch (protocol) {
      case 'tcp':
        return `${styles.protocolBadge} ${styles.tcpBadge}`
      case 'udp':
        return `${styles.protocolBadge} ${styles.udpBadge}`
      case 'icmp':
        return `${styles.protocolBadge} ${styles.icmpBadge}`
      default:
        return styles.protocolBadge
    }
  }

  // Fetch data on component mount
  useEffect(() => {
    fetchInstanceData()
  }, [fetchInstanceData])

  return (
    <Flex className={styles.bg} direction="column">
      <Flex className={styles.header}>
        <Flex justify="between" width="100%">
          <Flex direction="column">
            <div className={styles.headerTitle}>Firewall Settings</div>
            <div className={styles.subTitle}>Manage network access for your GPU instance</div>
          </Flex>
          <Button className={styles.backButton} onClick={() => router.push(`/dashboard/instances/${vmId}`)}>
            <BackIcon />
            Back to Instance
          </Button>
        </Flex>
      </Flex>

      {/* Navigation Tabs */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabsList}>
          <Link href={`/dashboard/instances/${vmId}`} className={styles.tabItem}>
            <OverviewIcon /> Overview
          </Link>
          <Link href={`/dashboard/instances/${vmId}/networking`} className={styles.tabItem}>
            <NetworkIcon /> Networking
          </Link>
          <Link href={`/dashboard/instances/${vmId}/firewall`} className={`${styles.tabItem} ${styles.activeTab}`}>
            <FirewallIcon /> Firewall
          </Link>
        </div>
      </div>

      {isLoading ? (
        <Flex className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <div className={styles.loadingText}>Loading firewall settings...</div>
        </Flex>
      ) : error ? (
        <Flex className={styles.errorContainer}>
          <div className={styles.errorText}>{error}</div>
          <Button className={styles.retryButton} onClick={fetchInstanceData}>
            Retry
          </Button>
        </Flex>
      ) : (
        <div className={styles.firewallContainer}>
          <div className={styles.firewallHeader}>
            <div className={styles.firewallTitle}>
              <FirewallIcon />
              Firewall Settings for {instance?.gpu_name}
            </div>
          </div>

          <div className={styles.firewallContent}>
            {/* Status Card */}
            <div className={styles.statusCard}>
              <div className={styles.statusCardIcon}>
                <FirewallIcon />
              </div>
              <div className={styles.statusCardContent}>
                <h3>
                  Firewall Status: <span className={styles.statusActive}>Active</span>
                </h3>
                <p>
                  Your firewall is currently active and protecting your instance. Configure the rules below to customize
                  access.
                </p>
              </div>
            </div>

            {/* Basic Access Controls */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>
                  <KeyIcon /> Quick Access Controls
                </div>
                <div className={styles.sectionDescription}>
                  Configure basic access controls for common protocols. These settings provide a quick way to enable or
                  disable common access patterns.
                </div>
              </div>

              <div className={styles.quickAccessGrid}>
                <div className={styles.quickAccessCard}>
                  <div className={styles.quickAccessHeader}>
                    <div className={styles.quickAccessTitle}>
                      <SSHIcon /> SSH Access
                    </div>
                    <label className={styles.toggleSwitch}>
                      <input type="checkbox" checked={sshEnabled} onChange={handleToggleSSH} />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                  <div className={styles.quickAccessDescription}>Allow SSH connections on port 22</div>
                  <div className={styles.quickAccessStatus}>
                    Status:{' '}
                    <span className={sshEnabled ? styles.statusEnabled : styles.statusDisabled}>
                      {sshEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>

                <div className={styles.quickAccessCard}>
                  <div className={styles.quickAccessHeader}>
                    <div className={styles.quickAccessTitle}>
                      <PingIcon /> ICMP (Ping)
                    </div>
                    <label className={styles.toggleSwitch}>
                      <input type="checkbox" checked={icmpEnabled} onChange={handleToggleICMP} />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                  <div className={styles.quickAccessDescription}>Allow ping and other ICMP traffic</div>
                  <div className={styles.quickAccessStatus}>
                    Status:{' '}
                    <span className={icmpEnabled ? styles.statusEnabled : styles.statusDisabled}>
                      {icmpEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Inbound Rules */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>
                  <InboundIcon /> Inbound Rules
                </div>
                <div className={styles.sectionDescription}>
                  Control incoming traffic to your instance. Inbound rules determine what traffic is allowed to reach
                  your instance.
                </div>
              </div>

              {inboundRules.length > 0 ? (
                <div className={styles.tableContainer}>
                  <table className={styles.rulesTable}>
                    <thead>
                      <tr>
                        <th>Protocol</th>
                        <th>Port Range</th>
                        <th>Source</th>
                        <th>Description</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inboundRules.map((rule) => (
                        <tr key={rule.id}>
                          <td>
                            <span className={getProtocolBadgeClass(rule.protocol)}>{rule.protocol.toUpperCase()}</span>
                          </td>
                          <td>{rule.port_range}</td>
                          <td>{rule.source}</td>
                          <td>{rule.description}</td>
                          <td>
                            <button
                              className={styles.deleteButton}
                              onClick={() => handleDeleteRule(rule.id, 'inbound')}
                              aria-label="Delete rule"
                            >
                              <DeleteIcon />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={styles.emptyRules}>
                  <InboxIcon />
                  <p>No inbound rules configured</p>
                  <span>Add rules to control incoming traffic to your instance</span>
                </div>
              )}

              <div className={styles.addRuleSection}>
                <div className={styles.addRuleHeader}>
                  <h4>Add New Inbound Rule</h4>
                  <p>Define which incoming traffic is allowed to reach your instance</p>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Protocol</label>
                    <select
                      className={styles.formSelect}
                      value={newInboundRule.protocol}
                      onChange={(e) => setNewInboundRule({ ...newInboundRule, protocol: e.target.value })}
                    >
                      <option value="tcp">TCP</option>
                      <option value="udp">UDP</option>
                      <option value="icmp">ICMP</option>
                    </select>
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Port Range</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="e.g., 80 or 8000-9000"
                      value={newInboundRule.port_range}
                      onChange={(e) => setNewInboundRule({ ...newInboundRule, port_range: e.target.value })}
                    />
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Source</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="e.g., 0.0.0.0/0 or 192.168.1.0/24"
                      value={newInboundRule.source}
                      onChange={(e) => setNewInboundRule({ ...newInboundRule, source: e.target.value })}
                    />
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Description</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="e.g., HTTP Access"
                      value={newInboundRule.description}
                      onChange={(e) => setNewInboundRule({ ...newInboundRule, description: e.target.value })}
                    />
                  </div>
                </div>

                <button className={styles.addButton} onClick={handleAddInboundRule}>
                  <AddIcon /> Add Inbound Rule
                </button>

                <div className={styles.templateSection}>
                  <div className={styles.templateHeader}>
                    <h5>Common Templates</h5>
                  </div>
                  <div className={styles.templateButtons}>
                    <button
                      className={styles.templateButton}
                      onClick={() => {
                        setNewInboundRule({
                          protocol: 'tcp',
                          port_range: '80',
                          source: '0.0.0.0/0',
                          description: 'HTTP'
                        })
                      }}
                    >
                      <GlobeIcon /> HTTP (80)
                    </button>
                    <button
                      className={styles.templateButton}
                      onClick={() => {
                        setNewInboundRule({
                          protocol: 'tcp',
                          port_range: '443',
                          source: '0.0.0.0/0',
                          description: 'HTTPS'
                        })
                      }}
                    >
                      <LockIcon /> HTTPS (443)
                    </button>
                    <button
                      className={styles.templateButton}
                      onClick={() => {
                        setNewInboundRule({
                          protocol: 'tcp',
                          port_range: '3389',
                          source: '0.0.0.0/0',
                          description: 'RDP'
                        })
                      }}
                    >
                      <MonitorIcon /> RDP (3389)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Outbound Rules */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>
                  <OutboundIcon /> Outbound Rules
                </div>
                <div className={styles.sectionDescription}>
                  Control outgoing traffic from your instance. Outbound rules determine what traffic is allowed to leave
                  your instance.
                </div>
              </div>

              {outboundRules.length > 0 ? (
                <div className={styles.tableContainer}>
                  <table className={styles.rulesTable}>
                    <thead>
                      <tr>
                        <th>Protocol</th>
                        <th>Port Range</th>
                        <th>Destination</th>
                        <th>Description</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {outboundRules.map((rule) => (
                        <tr key={rule.id}>
                          <td>
                            <span className={getProtocolBadgeClass(rule.protocol)}>{rule.protocol.toUpperCase()}</span>
                          </td>
                          <td>{rule.port_range}</td>
                          <td>{rule.source}</td>
                          <td>{rule.description}</td>
                          <td>
                            <button
                              className={styles.deleteButton}
                              onClick={() => handleDeleteRule(rule.id, 'outbound')}
                              aria-label="Delete rule"
                            >
                              <DeleteIcon />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={styles.emptyRules}>
                  <InboxIcon />
                  <p>No outbound rules configured</p>
                  <span>Add rules to control outgoing traffic from your instance</span>
                </div>
              )}

              <div className={styles.addRuleSection}>
                <div className={styles.addRuleHeader}>
                  <h4>Add New Outbound Rule</h4>
                  <p>Define which outgoing traffic is allowed to leave your instance</p>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Protocol</label>
                    <select
                      className={styles.formSelect}
                      value={newOutboundRule.protocol}
                      onChange={(e) => setNewOutboundRule({ ...newOutboundRule, protocol: e.target.value })}
                    >
                      <option value="tcp">TCP</option>
                      <option value="udp">UDP</option>
                      <option value="icmp">ICMP</option>
                    </select>
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Port Range</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="e.g., 80 or 8000-9000"
                      value={newOutboundRule.port_range}
                      onChange={(e) => setNewOutboundRule({ ...newOutboundRule, port_range: e.target.value })}
                    />
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Destination</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="e.g., 0.0.0.0/0 or 192.168.1.0/24"
                      value={newOutboundRule.source}
                      onChange={(e) => setNewOutboundRule({ ...newOutboundRule, source: e.target.value })}
                    />
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Description</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="e.g., HTTP Access"
                      value={newOutboundRule.description}
                      onChange={(e) => setNewOutboundRule({ ...newOutboundRule, description: e.target.value })}
                    />
                  </div>
                </div>

                <button className={styles.addButton} onClick={handleAddOutboundRule}>
                  <AddIcon /> Add Outbound Rule
                </button>

                <div className={styles.templateSection}>
                  <div className={styles.templateHeader}>
                    <h5>Common Templates</h5>
                  </div>
                  <div className={styles.templateButtons}>
                    <button
                      className={styles.templateButton}
                      onClick={() => {
                        setNewOutboundRule({
                          protocol: 'tcp',
                          port_range: '1-65535',
                          source: '0.0.0.0/0',
                          description: 'All TCP Traffic'
                        })
                      }}
                    >
                      <GlobeIcon /> All TCP
                    </button>
                    <button
                      className={styles.templateButton}
                      onClick={() => {
                        setNewOutboundRule({
                          protocol: 'udp',
                          port_range: '1-65535',
                          source: '0.0.0.0/0',
                          description: 'All UDP Traffic'
                        })
                      }}
                    >
                      <ActivityIcon /> All UDP
                    </button>
                    <button
                      className={styles.templateButton}
                      onClick={() => {
                        setNewOutboundRule({
                          protocol: 'tcp',
                          port_range: '443',
                          source: '0.0.0.0/0',
                          description: 'HTTPS Outbound'
                        })
                      }}
                    >
                      <LockIcon /> HTTPS Only
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Settings */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>
                  <SettingIcon /> Advanced Settings
                </div>
                <div className={styles.sectionDescription}>Configure advanced firewall settings for your instance.</div>
              </div>

              <div className={styles.advancedSettingsCard}>
                <div className={styles.advancedSettingsIcon}>
                  <ToolIcon />
                </div>
                <div className={styles.advancedSettingsContent}>
                  <h4>Advanced Firewall Configuration</h4>
                  <p>Advanced firewall settings will be available in a future update. These will include:</p>
                  <ul className={styles.advancedList}>
                    <li>Rule priorities and ordering</li>
                    <li>Stateful packet inspection</li>
                    <li>Rate limiting and DDoS protection</li>
                    <li>Custom rule templates</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Flex>
  )
}

export default FirewallPage
