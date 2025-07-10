'use client'

import { useState, useEffect, useCallback } from 'react'
import { Flex, Button } from '@radix-ui/themes'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { getGpuAction, addFirewallRule, getFirewallRules, deleteFirewallRule } from '@/api/GpuProvider'
import DynamicSvgIcon from '@/components/icons/DynamicSvgIcon'
import { FormSelect } from '@/components/select/FormSelect'
import { Snackbar } from '@/components/snackbar/SnackBar'
import styles from './page.module.css'

// Icons
const BackIcon = () => <DynamicSvgIcon height={18} className="rounded-none" iconName="left-arrow" />
const FirewallIcon = () => <DynamicSvgIcon height={18} className="rounded-none" iconName="firewall-icon" />
const SSHIcon = () => <DynamicSvgIcon height={16} className="rounded-none" iconName="terminal-icon" />
const PingIcon = () => <DynamicSvgIcon height={16} className="rounded-none" iconName="activity-icon" />
const NetworkIcon = () => <DynamicSvgIcon height={16} className="rounded-none" iconName="network-icon" />
const OverviewIcon = () => <DynamicSvgIcon height={16} className="rounded-none" iconName="overview-icon" />
const AddIcon = () => <DynamicSvgIcon height={16} className="rounded-none" iconName="pluscircle-icon" />
const DeleteIcon = () => <DynamicSvgIcon height={16} className="rounded-none" iconName="trash-icon" />
const ShieldIcon = () => <DynamicSvgIcon height={48} className="rounded-none" iconName="shield-check" />
const InboundIcon = () => <DynamicSvgIcon height={16} className="rounded-none" iconName="download-icon" />
const OutboundIcon = () => <DynamicSvgIcon height={16} className="rounded-none" iconName="upload-icon" />

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

// Define firewall rule interface based on API response
interface FirewallRule {
  id: number
  gpu_rental_id: number
  direction: string
  protocol: string
  port_range_min: number
  port_range_max: number
  ethertype: string
  remote_ip_prefix: string
  action: string
  description?: string
  createdAt: string
  updatedAt: string
  gpu_id?: number
}

const FirewallPage = () => {
  const router = useRouter()
  const params = useParams()
  const vmId = params?.vmId as string

  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [instance, setInstance] = useState<GpuInstance | null>(null)
  const [firewallRules, setFirewallRules] = useState<FirewallRule[]>([])
  const [isAddingRule, setIsAddingRule] = useState<boolean>(false)

  // Quick access toggles
  const [sshEnabled, setSSHEnabled] = useState<boolean>(false)
  const [icmpEnabled, setICMPEnabled] = useState<boolean>(false)

  // Form state for adding new rules
  const [newRule, setNewRule] = useState({
    direction: 'ingress',
    ethertype: 'IPv4',
    protocol: 'tcp',
    port_range_min: '',
    port_range_max: '',
    remote_ip_prefix: '0.0.0.0/0'
  })

  // Form select options
  const directionOptions = [
    { label: 'Inbound (Ingress)', name: 'ingress' },
    { label: 'Outbound (Egress)', name: 'egress' }
  ]

  const ethertypeOptions = [
    { label: 'IPv4', name: 'IPv4' },
    { label: 'IPv6', name: 'IPv6' }
  ]

  const protocolOptions = [
    { label: 'TCP', name: 'tcp' },
    { label: 'UDP', name: 'udp' },
    { label: 'ICMP', name: 'icmp' }
  ]

  // Fetch instance data and firewall rules
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch instance data
      const response = await getGpuAction()

      if (response && response.status === 'success') {
        const gpuData = Array.isArray(response.gpu) ? response.gpu : [response.gpu]
        const foundInstance = gpuData.find(
          (inst) => inst.id.toString() === vmId || inst.instance_id.toString() === vmId
        )

        if (foundInstance) {
          const processedInstance = {
            ...foundInstance,
            status: foundInstance.status === 'BUILD' ? 'CREATING' : foundInstance.status
          }
          setInstance(processedInstance)

          // Fetch firewall rules
          try {
            const rulesResponse = await getFirewallRules(foundInstance.instance_id)
            if (rulesResponse && rulesResponse.status === 'success') {
              setFirewallRules(rulesResponse.rules || [])

              // Check if SSH and ICMP are enabled based on existing rules
              const hasSSH =
                rulesResponse.rules?.some(
                  (rule) =>
                    rule.protocol === 'tcp' &&
                    rule.port_range_min <= 22 &&
                    rule.port_range_max >= 22 &&
                    (rule.direction === 'ingress' || rule.direction === 'inbound')
                ) || false

              const hasICMP =
                rulesResponse.rules?.some(
                  (rule) => rule.protocol === 'icmp' && (rule.direction === 'ingress' || rule.direction === 'inbound')
                ) || false

              setSSHEnabled(hasSSH)
              setICMPEnabled(hasICMP)
            }
          } catch (rulesError) {
            console.error('Error fetching firewall rules:', rulesError)
            // Don't show error for missing rules, just set empty array
            setFirewallRules([])
          }
        } else {
          setError('Instance not found')
        }
      } else {
        setError('Failed to fetch instance details')
      }
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to fetch instance details. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [vmId])

  // Handle SSH toggle
  const handleToggleSSH = async () => {
    if (!instance) return

    try {
      if (!sshEnabled) {
        // Add SSH rule
        await addFirewallRule({
          vmId: instance.instance_id,
          direction: 'ingress',
          protocol: 'tcp',
          ethertype: 'IPv4',
          remote_ip_prefix: '0.0.0.0/0',
          port_range_min: 22,
          port_range_max: 22
        })
        setSSHEnabled(true)
        Snackbar({ message: 'SSH access enabled', type: 'success' })
      } else {
        // Remove SSH rule
        const sshRule = firewallRules.find(
          (rule) =>
            rule.protocol === 'tcp' &&
            rule.port_range_min <= 22 &&
            rule.port_range_max >= 22 &&
            (rule.direction === 'ingress' || rule.direction === 'inbound')
        )
        if (sshRule) {
          await deleteFirewallRule(sshRule.id)
          setSSHEnabled(false)
          Snackbar({ message: 'SSH access disabled', type: 'success' })
        }
      }
      // Refresh rules
      fetchData()
    } catch (error) {
      console.error('Error toggling SSH:', error)
      Snackbar({ message: 'Failed to update SSH access', type: 'error' })
    }
  }

  // Handle ICMP toggle
  const handleToggleICMP = async () => {
    if (!instance) return

    try {
      if (!icmpEnabled) {
        // Add ICMP rule
        await addFirewallRule({
          vmId: instance.instance_id,
          direction: 'ingress',
          protocol: 'icmp',
          ethertype: 'IPv4',
          remote_ip_prefix: '0.0.0.0/0',
          port_range_min: -1,
          port_range_max: -1
        })
        setICMPEnabled(true)
        Snackbar({ message: 'ICMP (ping) access enabled', type: 'success' })
      } else {
        // Remove ICMP rule
        const icmpRule = firewallRules.find(
          (rule) => rule.protocol === 'icmp' && (rule.direction === 'ingress' || rule.direction === 'inbound')
        )
        if (icmpRule) {
          await deleteFirewallRule(icmpRule.id)
          setICMPEnabled(false)
          Snackbar({ message: 'ICMP (ping) access disabled', type: 'success' })
        }
      }
      // Refresh rules
      fetchData()
    } catch (error) {
      console.error('Error toggling ICMP:', error)
      Snackbar({ message: 'Failed to update ICMP access', type: 'error' })
    }
  }

  // Handle adding new rule
  const handleAddRule = async () => {
    if (!instance) return

    // Validation
    if (!newRule.port_range_min || !newRule.port_range_max) {
      Snackbar({ message: 'Please fill in all required fields', type: 'error' })
      return
    }

    const minPort = Number.parseInt(newRule.port_range_min)
    const maxPort = Number.parseInt(newRule.port_range_max)

    if (newRule.protocol !== 'icmp') {
      if (isNaN(minPort) || isNaN(maxPort) || minPort < 1 || maxPort > 65535 || minPort > maxPort) {
        Snackbar({ message: 'Please enter valid port numbers (1-65535)', type: 'error' })
        return
      }
    }

    try {
      setIsAddingRule(true)

      await addFirewallRule({
        vmId: instance.instance_id,
        direction: newRule.direction as 'ingress' | 'egress',
        protocol: newRule.protocol as 'tcp' | 'udp' | 'icmp',
        ethertype: newRule.ethertype as 'IPv4' | 'IPv6',
        remote_ip_prefix: newRule.remote_ip_prefix,
        port_range_min: newRule.protocol === 'icmp' ? -1 : minPort,
        port_range_max: newRule.protocol === 'icmp' ? -1 : maxPort
      })

      // Reset form
      setNewRule({
        direction: 'ingress',
        ethertype: 'IPv4',
        protocol: 'tcp',
        port_range_min: '',
        port_range_max: '',
        remote_ip_prefix: '0.0.0.0/0'
      })

      Snackbar({ message: 'Firewall rule added successfully', type: 'success' })

      // Refresh data
      fetchData()
    } catch (error) {
      console.error('Error adding firewall rule:', error)
      Snackbar({
        message: error instanceof Error ? error.message : 'Failed to add firewall rule',
        type: 'error'
      })
    } finally {
      setIsAddingRule(false)
    }
  }

  // Handle deleting a rule
  const handleDeleteRule = async (ruleId: number) => {
    try {
      await deleteFirewallRule(ruleId)
      Snackbar({ message: 'Firewall rule deleted successfully', type: 'success' })

      // Refresh data
      fetchData()
    } catch (error) {
      console.error('Error deleting firewall rule:', error)
      Snackbar({
        message: error instanceof Error ? error.message : 'Failed to delete firewall rule',
        type: 'error'
      })
    }
  }

  // Get protocol badge class
  const getProtocolBadgeClass = (protocol: string) => {
    switch (protocol.toLowerCase()) {
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

  // Get direction badge class
  const getDirectionBadgeClass = (direction: string) => {
    switch (direction.toLowerCase()) {
      case 'ingress':
      case 'inbound':
        return `${styles.directionBadge} ${styles.ingressBadge}`
      case 'egress':
      case 'outbound':
        return `${styles.directionBadge} ${styles.egressBadge}`
      default:
        return styles.directionBadge
    }
  }

  // Format port range
  const formatPortRange = (min: number, max: number) => {
    if (min === -1 && max === -1) {
      return 'All'
    }
    if (min === max) {
      return min.toString()
    }
    return `${min}-${max}`
  }

  // Get direction display name
  const getDirectionDisplayName = (direction: string) => {
    switch (direction.toLowerCase()) {
      case 'ingress':
        return 'Inbound'
      case 'egress':
        return 'Outbound'
      case 'inbound':
        return 'Inbound'
      case 'outbound':
        return 'Outbound'
      default:
        return direction
    }
  }

  // Fetch data on component mount
  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <Flex className={styles.bg} direction="column">
      <Flex className={styles.header}>
        <Flex justify="between" width="100%">
          <Flex direction="column">
            <div className={styles.headerTitle}>Firewall Settings</div>
            <div className={styles.subTitle}>Manage network access rules for your GPU instance</div>
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
          <Button className={styles.retryButton} onClick={fetchData}>
            Retry
          </Button>
        </Flex>
      ) : (
        <div className={styles.firewallContainer}>
          <div className={styles.firewallHeader}>
            <div className={styles.firewallTitle}>
              <FirewallIcon />
              Firewall Configuration
            </div>
            <div className={styles.firewallDescription}>
              Configure network access rules for {instance?.gpu_name}. Control which traffic is allowed to reach your
              instance.
            </div>
          </div>

          {/* Quick Access Controls */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              <SSHIcon /> Quick Access Controls
            </div>

            <div className={styles.quickAccessGrid}>
              <div className={styles.quickAccessCard}>
                <div className={styles.quickAccessHeader}>
                  <div className={styles.quickAccessTitle}>
                    <SSHIcon /> SSH Access (Port 22)
                  </div>
                  <label className={styles.toggleSwitch}>
                    <input type="checkbox" checked={sshEnabled} onChange={handleToggleSSH} />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>
                <div className={styles.quickAccessDescription}>Allow SSH connections to your instance</div>
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

          {/* Add New Rule */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              <AddIcon /> Add New Firewall Rule
            </div>

            <div className={styles.addRuleForm}>
              <div className={styles.addRuleHeader}>
                <h3>Create Custom Rule</h3>
                <p>Define a custom firewall rule to control network access to your instance</p>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <FormSelect
                    label="Direction"
                    items={directionOptions}
                    value={newRule.direction}
                    onChange={(value) => setNewRule({ ...newRule, direction: value })}
                    required
                  />
                  <div className={styles.fieldHint}>
                    {newRule.direction === 'ingress' ? (
                      <span>
                        <InboundIcon /> Controls incoming traffic to your instance
                      </span>
                    ) : (
                      <span>
                        <OutboundIcon /> Controls outgoing traffic from your instance
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.formField}>
                  <FormSelect
                    label="Ether Type"
                    items={ethertypeOptions}
                    value={newRule.ethertype}
                    onChange={(value) => setNewRule({ ...newRule, ethertype: value })}
                    required
                  />
                </div>

                <div className={styles.formField}>
                  <FormSelect
                    label="Protocol"
                    items={protocolOptions}
                    value={newRule.protocol}
                    onChange={(value) => setNewRule({ ...newRule, protocol: value })}
                    required
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>
                    Port Range{' '}
                    {newRule.protocol === 'icmp' && <span className={styles.optional}>(Not applicable for ICMP)</span>}
                  </label>
                  <div className={styles.portRangeContainer}>
                    <input
                      type="number"
                      className={styles.portRangeInput}
                      placeholder="Min"
                      min="1"
                      max="65535"
                      value={newRule.port_range_min}
                      onChange={(e) => setNewRule({ ...newRule, port_range_min: e.target.value })}
                      disabled={newRule.protocol === 'icmp'}
                    />
                    <span className={styles.portRangeSeparator}>-</span>
                    <input
                      type="number"
                      className={styles.portRangeInput}
                      placeholder="Max"
                      min="1"
                      max="65535"
                      value={newRule.port_range_max}
                      onChange={(e) => setNewRule({ ...newRule, port_range_max: e.target.value })}
                      disabled={newRule.protocol === 'icmp'}
                    />
                  </div>
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>
                    {newRule.direction === 'ingress' ? 'Source IP' : 'Destination IP'}
                  </label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="e.g., 0.0.0.0/0"
                    value={newRule.remote_ip_prefix}
                    onChange={(e) => setNewRule({ ...newRule, remote_ip_prefix: e.target.value })}
                  />
                  <div className={styles.fieldHint}>
                    Use 0.0.0.0/0 to allow all IP addresses, or specify a specific IP/CIDR range
                  </div>
                </div>
              </div>

              <button className={styles.addButton} onClick={handleAddRule} disabled={isAddingRule}>
                <AddIcon />
                {isAddingRule ? 'Adding Rule...' : 'Add Firewall Rule'}
              </button>
            </div>
          </div>

          {/* Firewall Rules Table */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              <FirewallIcon /> Current Firewall Rules
            </div>

            {firewallRules.length > 0 ? (
              <div className={styles.tableContainer}>
                <table className={styles.rulesTable}>
                  <thead>
                    <tr>
                      <th>Direction</th>
                      <th>Protocol</th>
                      <th>Port Range</th>
                      <th>Source/Destination</th>
                      <th>Ether Type</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {firewallRules.map((rule) => (
                      <tr key={rule.id}>
                        <td>
                          <span className={getDirectionBadgeClass(rule.direction)}>
                            {getDirectionDisplayName(rule.direction)}
                          </span>
                        </td>
                        <td>
                          <span className={getProtocolBadgeClass(rule.protocol)}>{rule.protocol.toUpperCase()}</span>
                        </td>
                        <td>{formatPortRange(rule.port_range_min, rule.port_range_max)}</td>
                        <td>{rule.remote_ip_prefix}</td>
                        <td>{rule.ethertype}</td>
                        <td>
                          <button
                            className={styles.deleteButton}
                            onClick={() => handleDeleteRule(rule.id)}
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
              <div className={styles.emptyState}>
                <ShieldIcon />
                <h3>No Firewall Rules</h3>
                <p>No custom firewall rules have been configured yet. Add rules above to control network access.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </Flex>
  )
}

export default FirewallPage
