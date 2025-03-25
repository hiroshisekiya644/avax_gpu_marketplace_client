'use client'

import { useEffect, useState, useCallback } from 'react'
import { Flex, Button } from '@radix-ui/themes'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import DynamicSvgIcon from '@/components/icons/DynamicSvgIcon'
import { Snackbar } from '@/components/snackbar/SnackBar'
import styles from './page.module.css'

// Icons
const CheckIcon = () => <DynamicSvgIcon height={24} className="rounded-none" iconName="dialogCheck" />
// const ErrorIcon = () => <DynamicSvgIcon height={24} className="rounded-none" iconName="alert-circle" />
// const ClockIcon = () => <DynamicSvgIcon height={24} className="rounded-none" iconName="clock-icon" />

// Deployment stages
enum DeploymentStage {
  INITIALIZING = 'initializing',
  PROVISIONING = 'provisioning',
  CONFIGURING = 'configuring',
  STARTING = 'starting',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

const DeployCluster = () => {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get parameters from URL
  const gpuName = searchParams.get('gpu') || ''
  const gpuRegion = searchParams.get('region') || ''
  const imageName = searchParams.get('image') || ''
  const price = searchParams.get('price') || '0'

  // State for deployment progress
  const [currentStage, setCurrentStage] = useState<DeploymentStage>(DeploymentStage.INITIALIZING)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [instanceId, setInstanceId] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [isDeploying, setIsDeploying] = useState(true)

  // Get message for each stage
  const getStageMessage = useCallback(
    (stage: DeploymentStage): string => {
      switch (stage) {
        case DeploymentStage.INITIALIZING:
          return `Initializing deployment process for ${gpuName}`
        case DeploymentStage.PROVISIONING:
          return `Provisioning GPU resources in ${gpuRegion}`
        case DeploymentStage.CONFIGURING:
          return `Configuring instance with ${imageName}`
        case DeploymentStage.STARTING:
          return `Starting services and finalizing setup`
        case DeploymentStage.COMPLETED:
          return `Deployment completed successfully! Instance ID: ${instanceId}`
        case DeploymentStage.FAILED:
          return `Deployment failed: ${error}`
        default:
          return `Unknown stage`
      }
    },
    [gpuName, gpuRegion, imageName, instanceId, error]
  )

  // Simulate deployment process
  useEffect(() => {
    if (!isDeploying) return

    const stages = [
      DeploymentStage.INITIALIZING,
      DeploymentStage.PROVISIONING,
      DeploymentStage.CONFIGURING,
      DeploymentStage.STARTING,
      DeploymentStage.COMPLETED
    ]

    let currentIndex = 0

    // Add initial log
    setLogs((prev) => [...prev, `[${new Date().toISOString()}] Starting deployment of ${gpuName} with ${imageName}`])

    // Generate a random instance ID
    const generatedId = `inst-${Math.random().toString(36).substring(2, 10)}`
    setInstanceId(generatedId)

    const interval = setInterval(() => {
      if (currentIndex < stages.length) {
        const stage = stages[currentIndex]
        setCurrentStage(stage)

        // Add log for current stage
        setLogs((prev) => [...prev, `[${new Date().toISOString()}] ${getStageMessage(stage)}`])

        // Update progress (divide 100% by number of stages)
        setProgress(Math.round((currentIndex + 1) * (100 / stages.length)))

        currentIndex++
      } else {
        clearInterval(interval)
        setIsDeploying(false)
      }
    }, 3000) // Each stage takes 3 seconds

    return () => clearInterval(interval)
  }, [gpuName, imageName, isDeploying, getStageMessage])

  // Handle manual retry
  const handleRetry = () => {
    setCurrentStage(DeploymentStage.INITIALIZING)
    setProgress(0)
    setError(null)
    setIsDeploying(true)
    setLogs([])
  }

  // Handle view instance details
  const handleViewInstance = () => {
    router.push('/dashboard/instances')
    Snackbar({ message: 'Redirecting to your instances' })
  }

  return (
    <Flex className={styles.bg} direction="column">
      <Flex className={styles.header} p="4">
        <Flex justify="between">
          <Flex direction="column">
            <div className={styles.headerTitle}>Deploying GPU Instance</div>
            <div className={styles.subTitle}>
              Your GPU instance is being provisioned. This process may take a few minutes.
            </div>
          </Flex>
        </Flex>
      </Flex>

      <Flex p="4" gap="4" direction="column">
        {/* Deployment Status Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Deployment Status</h2>
            <div className={styles.statusBadge} data-status={currentStage}>
              {currentStage === DeploymentStage.COMPLETED
                ? 'Completed'
                : currentStage === DeploymentStage.FAILED
                  ? 'Failed'
                  : 'In Progress'}
            </div>
          </div>

          <div className={styles.progressContainer}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${progress}%` }}
                data-status={currentStage === DeploymentStage.FAILED ? 'error' : ''}
              ></div>
            </div>
            <div className={styles.progressText}>{progress}% Complete</div>
          </div>

          <div className={styles.deploymentDetails}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>GPU:</span>
              <span className={styles.detailValue}>{gpuName}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Region:</span>
              <span className={styles.detailValue}>{gpuRegion}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Image:</span>
              <span className={styles.detailValue}>{imageName}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Price:</span>
              <span className={styles.detailValue}>${price}/hr</span>
            </div>
            {instanceId && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Instance ID:</span>
                <span className={styles.detailValue}>{instanceId}</span>
              </div>
            )}
          </div>

          <div className={styles.stagesList}>
            {Object.values(DeploymentStage).map((stage, index) => {
              if (stage === DeploymentStage.FAILED && currentStage !== DeploymentStage.FAILED) {
                return null
              }

              const isCurrentStage = stage === currentStage
              const isCompleted =
                Object.values(DeploymentStage).indexOf(currentStage) >= Object.values(DeploymentStage).indexOf(stage)

              return (
                <div
                  key={stage}
                  className={`${styles.stageItem} ${isCurrentStage ? styles.currentStage : ''} ${isCompleted ? styles.completedStage : ''}`}
                >
                  <div className={styles.stageIcon}>{isCompleted ? <CheckIcon /> : index + 1}</div>
                  <div className={styles.stageName}>{stage.charAt(0).toUpperCase() + stage.slice(1)}</div>
                </div>
              )
            })}
          </div>

          <div className={styles.actionButtons}>
            {currentStage === DeploymentStage.COMPLETED ? (
              <Button className={styles.primaryButton} onClick={handleViewInstance}>
                View Instance
              </Button>
            ) : currentStage === DeploymentStage.FAILED ? (
              <Button className={styles.retryButton} onClick={handleRetry}>
                Retry Deployment
              </Button>
            ) : (
              <Button className={styles.disabledButton} disabled>
                Deploying...
              </Button>
            )}

            <Link href="/dashboard/create-cluster">
              <Button className={styles.secondaryButton}>Back to Cluster Creation</Button>
            </Link>
          </div>
        </div>

        {/* Deployment Logs Card */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Deployment Logs</h2>
          <div className={styles.logsContainer}>
            {logs.map((log, index) => (
              <div key={index} className={styles.logEntry}>
                {log}
              </div>
            ))}
            {isDeploying && (
              <div className={styles.logEntry}>
                <div className={styles.logCursor}></div>
              </div>
            )}
          </div>
        </div>
      </Flex>
    </Flex>
  )
}

export default DeployCluster
