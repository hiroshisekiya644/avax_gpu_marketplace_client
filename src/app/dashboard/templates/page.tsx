'use client'
import React, { ReactNode, useState } from 'react'
import * as Accordion from '@radix-ui/react-accordion'
import * as Dialog from '@radix-ui/react-dialog'
import { ChevronDownIcon } from '@radix-ui/react-icons'
import { PlusIcon } from '@radix-ui/react-icons'
import * as Switch from '@radix-ui/react-switch'
import * as Tabs from '@radix-ui/react-tabs'
import { Flex, Button } from '@radix-ui/themes'
import { useRouter } from 'next/navigation'
import DynamicSvgIcon from '@/components/icons/DynamicSvgIcon'
import { FormInput } from '@/components/input/FormInput'
import { FormTextArea } from '@/components/input/FormTextArea'
import { FormSelect, SelectItem } from '@/components/select/FormSelect'
import { Snackbar } from '@/components/snackbar/SnackBar'
import { useResize } from '@/utils/Helper'
import styles from './page.module.css'

const ListIcon = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="list-icon" />
const SettingsIcon = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="settings-icon" />
const CopyIcon = () => <DynamicSvgIcon height={16} className="rounded-none" iconName="copy-icon" />
const DialogCheck = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="dialogCheck" />
const EditIcon = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="edit-icon" />
const DeleteIcon = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="delete-icon" />
const DeployIcon = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="deploy-icon" />
const ViewIcon = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="view-icon" />
const PortIcon = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="port-icon" />
const VariableIcon = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="variable-icon" />
const FilterIcon = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="filter-icon" />
const PlusCircleIcon = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="plusCircle-icon" />

type TabValue = 'list' | 'settings'
type Template = {
  name: string
  id: string
  imageName: string
  description: string | ReactNode
}

interface Field {
  key: string
  value: string
}

const tabValues: TabValue[] = ['list', 'settings']
const tabListItems = [
  { name: 'List', icon: <ListIcon />, value: 'list' },
  { name: 'Settings', icon: <SettingsIcon />, value: 'settings' }
]

const privateTemplates: Template[] = [
  {
    name: '123',
    id: 'cm4a9asxt00b412wmkrouogm0',
    imageName: '123',
    description: '123456'
  }
]

const publicTemplates: Template[] = [
  {
    name: 'INTELLECT-1',
    id: 'cm4a9asxt00b412wmkrouogm1',
    imageName: 'primeintellect/intellect-1',
    description:
      'Join the first globally distributed training of a 10B parameter model to advance open-source AI. Note: Your profile information will be visible on the public dashboard.'
  },
  {
    name: 'Qwen/Qwen2.5-32B-Instruct',
    id: 'cm452zakr00buhxl427ge8gv7',
    imageName: 'primeintellect/pytorch:2.2.2-py3.10-cuda12.1.1-devel-ubuntu22.04',
    description:
      'Join the first globally distributed training of a 10B parameter model to advance open-source AI. Note: Your profile information will be visible on the public dashboard.'
  }
]

const dummyValue: SelectItem[] = [
  { label: '8', name: '8' },
  { label: '16', name: '16' },
  { label: '32', name: '32' },
  { label: '64', name: '64' },
  { label: '128', name: '128' }
]

const Templates = () => {
  const router = useRouter()
  const { isResponsive } = useResize()
  const [activeTab, setActiveTab] = useState<TabValue>(tabValues[0])
  const [tempValue, setTempValue] = useState('')
  const [copied, setCopied] = useState(false)
  const [copiedImageName, setCopiedImageName] = useState(false)
  // modal states
  const [deleteModalOpen, setDeleteModalopen] = useState(false)
  const [templateModalOpen, setTemplateModalOpen] = useState(false)
  const [registryModalOpen, setRegistryModalOpen] = useState(false)
  const [secretModalOpen, setSecretModalOpen] = useState(false)

  // template modal fields
  const [fields, setFields] = useState<Field[]>([{ key: '123', value: '123' }])

  const handleAddField = () => {
    setFields([...fields, { key: '', value: '' }])
  }

  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index))
  }

  const handleFieldChange = (index: number, fieldName: keyof Field, value: string) => {
    const updatedFields = fields.map((field, i) => (i === index ? { ...field, [fieldName]: value } : field))
    setFields(updatedFields)
  }

  const handleTabChange = (value: TabValue) => {
    setActiveTab(value)
  }

  const handleCopy = async (id: string) => {
    await navigator.clipboard.writeText(id)
    setTempValue(id)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  const handleCopyImageName = async (imageName: string) => {
    await navigator.clipboard.writeText(tempValue)
    setTempValue(imageName)
    setCopiedImageName(true)
    setTimeout(() => setCopiedImageName(false), 3000)
  }

  const handleSubmit = () => {
    Snackbar({ message: 'You have successfully updated.' })
    setTemplateModalOpen(false)
  }

  const handleDelete = () => {
    Snackbar({ message: 'You have successfully deleted.' })
    setDeleteModalopen(false)
  }

  // for future use
  // const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = event.target.files?.[0]

  //   if (file && file.type === 'text/plain') {
  //     const text = await file.text()
  //   } else {
  //     return
  //   }
  // }

  return (
    <Flex className={styles.bg} direction="column">
      <Flex className={styles.header} p="4">
        <Flex justify="between" width="100%">
          <Flex direction="column">
            <div className={styles.headerTitle}>Templates</div>
            <div className={styles.subTitle}>Manage your pod templates here</div>
          </Flex>
          <Flex align="center" display={isResponsive ? 'none' : 'flex'}>
            <Button className={styles.headerButton} onClick={() => setTemplateModalOpen(true)}>
              <span>Create New Template</span>
              <PlusCircleIcon />
            </Button>
          </Flex>
        </Flex>
      </Flex>
      <Flex p="4">
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
          <Tabs.Content value="list" className={styles.tabContent}>
            <Flex direction="column" gap="4" mt="4">
              <Flex className={styles.templatesTitle}>Your Private Templates</Flex>
              {privateTemplates.map((privateTemplate, i) => (
                <Flex p="4" key={i} direction="column" gap="10px" width="100%" className={styles.templatesCardWrapper}>
                  <Flex
                    justify={isResponsive ? 'start' : 'between'}
                    direction={isResponsive ? 'column' : 'row'}
                    gap="4"
                  >
                    <Flex gap="4" direction={isResponsive ? 'column' : 'row'}>
                      <div className={styles.templatesTitle}>{privateTemplate.name}</div>
                      <Flex align="center" gap="1" className={styles.codeBlock} p="1">
                        <Flex className={styles.subText} ml="2">
                          ID &nbsp;
                        </Flex>
                        <code>{privateTemplate.id}</code>
                        <div className={styles.copyButton} onClick={() => handleCopy(privateTemplate.id)}>
                          {copied && tempValue === privateTemplate.id ? <DialogCheck /> : <CopyIcon />}
                        </div>
                      </Flex>
                    </Flex>
                    <Flex gap="2" wrap="wrap">
                      <Button
                        className={styles.deployButton}
                        onClick={() => router.push('/dashboard/create-cluster/search')}
                      >
                        <Flex align="center" gap="1">
                          Deploy
                          <DeployIcon />
                        </Flex>
                      </Button>
                      <Button className={styles.editButton} onClick={() => setTemplateModalOpen(true)}>
                        <Flex align="center" gap="1">
                          Edit
                          <EditIcon />
                        </Flex>
                      </Button>
                      <Button className={styles.editButton} onClick={() => setTemplateModalOpen(true)}>
                        <Flex align="center" gap="1">
                          Duplicate
                          <CopyIcon />
                        </Flex>
                      </Button>
                      <Button className={styles.deleteButton} onClick={() => setDeleteModalopen(true)}>
                        <Flex align="center" gap="1">
                          Delete
                          <DeleteIcon />
                        </Flex>
                      </Button>
                    </Flex>
                  </Flex>
                  <Flex align="center" gap="1" className={styles.codeBlock} p="1" width="100%" justify="between">
                    <Flex>
                      <Flex className={styles.subText} ml="2">
                        Container Image &nbsp;
                      </Flex>
                      <code>{privateTemplate.imageName}</code>
                    </Flex>
                    <div className={styles.copyButton} onClick={() => handleCopyImageName(privateTemplate.imageName)}>
                      {copiedImageName && tempValue === privateTemplate.imageName ? <DialogCheck /> : <CopyIcon />}
                    </div>
                  </Flex>
                  <Accordion.Root type="single" collapsible>
                    <Accordion.Item value={privateTemplate.id}>
                      <Accordion.Trigger className={styles.accordionTrigger}>
                        <Flex align="center" gap="2" className={styles.accordionButton}>
                          <Flex className={styles.subText}>Description</Flex>
                          <ChevronDownIcon className={styles.chevronIcon} aria-hidden />
                        </Flex>
                      </Accordion.Trigger>
                      <Accordion.Content>
                        <Flex className={styles.description} m="4">
                          {privateTemplate.description}
                        </Flex>
                      </Accordion.Content>
                    </Accordion.Item>
                  </Accordion.Root>
                </Flex>
              ))}
              <Flex className={styles.templatesTitle} mt="4">
                Public Templates
              </Flex>
              {publicTemplates.map((privateTemplate, i) => (
                <Flex p="4" key={i} direction="column" gap="10px" width="100%" className={styles.templatesCardWrapper}>
                  <Flex
                    justify={isResponsive ? 'start' : 'between'}
                    direction={isResponsive ? 'column' : 'row'}
                    gap="4"
                  >
                    <Flex gap="4" direction={isResponsive ? 'column' : 'row'}>
                      <div className={styles.templatesTitle}>{privateTemplate.name}</div>
                      <Flex align="center" gap="1" className={styles.codeBlock} p="1">
                        <Flex className={styles.subText} ml="2">
                          ID &nbsp;
                        </Flex>
                        <code>{privateTemplate.id}</code>
                        <div className={styles.copyButton} onClick={() => handleCopy(privateTemplate.id)}>
                          {copied && tempValue === privateTemplate.id ? <DialogCheck /> : <CopyIcon />}
                        </div>
                      </Flex>
                    </Flex>
                    <Flex gap="2">
                      <Button
                        className={styles.deployButton}
                        onClick={() => router.push('/dashboard/create-cluster/search')}
                      >
                        <Flex align="center" gap="1">
                          Deploy
                          <DeployIcon />
                        </Flex>
                      </Button>
                      <Button className={styles.editButton} onClick={() => setTemplateModalOpen(true)}>
                        <Flex align="center" gap="1">
                          View
                          <ViewIcon />
                        </Flex>
                      </Button>
                    </Flex>
                  </Flex>
                  <Flex align="center" gap="1" className={styles.codeBlock} p="1" width="100%" justify="between">
                    <Flex gap="2">
                      <Flex className={styles.subText} ml="2">
                        Container Image &nbsp;
                      </Flex>
                      <code>{privateTemplate.imageName}</code>
                    </Flex>
                    <div className={styles.copyButton} onClick={() => handleCopyImageName(privateTemplate.imageName)}>
                      {copiedImageName && tempValue === privateTemplate.imageName ? <DialogCheck /> : <CopyIcon />}
                    </div>
                  </Flex>
                  <Accordion.Root type="single" collapsible>
                    <Accordion.Item value={privateTemplate.id}>
                      <Accordion.Trigger className={styles.accordionTrigger}>
                        <Flex align="center" gap="2" className={styles.accordionButton}>
                          <Flex className={styles.subText}>Description</Flex>
                          <ChevronDownIcon className={styles.chevronIcon} aria-hidden />
                        </Flex>
                      </Accordion.Trigger>
                      <Accordion.Content>
                        <Flex className={styles.description} m="4">
                          {privateTemplate.description}
                        </Flex>
                      </Accordion.Content>
                    </Accordion.Item>
                  </Accordion.Root>
                </Flex>
              ))}
            </Flex>
          </Tabs.Content>
          <Tabs.Content value="settings" className={styles.tabContent}>
            <Flex direction="column" gap="4" mt="4">
              <Flex p="4" direction="column" gap="20px" width="100%" className={styles.templatesCardWrapper}>
                <Flex justify="between" direction={isResponsive ? 'column' : 'row'} gap="2">
                  <Flex direction="column">
                    <Flex className={styles.templatesTitle}>Docker Registries</Flex>
                    <Flex className={styles.subTitle}>Manage your Docker registry credentials</Flex>
                  </Flex>
                  <Flex>
                    <Button className={styles.headerButton} onClick={() => setRegistryModalOpen(true)}>
                      <span>Add Custom Registry</span>
                      <PlusIcon />
                    </Button>
                  </Flex>
                </Flex>
                <Flex className={styles.codeBlock} p="4" justify="between">
                  <Flex align="center">123</Flex>
                  <Flex gap="2">
                    <Button className={styles.settingsIconButton}>
                      <VariableIcon />
                    </Button>
                    <Button className={styles.settingsIconButton}>
                      <DeleteIcon />
                    </Button>
                  </Flex>
                </Flex>
              </Flex>

              <Flex p="4" direction="column" gap="20px" width="100%" className={styles.templatesCardWrapper}>
                <Flex justify="between" direction={isResponsive ? 'column' : 'row'} gap="2">
                  <Flex direction="column">
                    <Flex className={styles.templatesTitle}>Secrets</Flex>
                    <Flex className={styles.subTitle}>Manage your secrets securely.</Flex>
                  </Flex>
                  <Flex>
                    <Button className={styles.headerButton} onClick={() => setSecretModalOpen(true)}>
                      <span>Add Secret</span>
                      <PlusIcon />
                    </Button>
                  </Flex>
                </Flex>
                <Flex className={styles.codeBlock} p="4" justify="between">
                  <Flex align="center" direction="column">
                    <span>123</span>
                    <span className={styles.subTitle}>123</span>
                  </Flex>
                  <Flex gap="2">
                    <Button className={styles.settingsIconButton}>
                      <VariableIcon />
                    </Button>
                    <Button className={styles.settingsIconButton}>
                      <DeleteIcon />
                    </Button>
                  </Flex>
                </Flex>
              </Flex>
            </Flex>
          </Tabs.Content>
        </Tabs.Root>
      </Flex>

      {/* delete dialog */}
      <Dialog.Root open={deleteModalOpen} onOpenChange={setDeleteModalopen}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.dialogOverlay} />
          <Dialog.Content className={styles.dialogContent}>
            <Dialog.Title />
            <Flex direction="column">
              <Flex className={styles.templatesTitle}>Delete Template</Flex>
              <Flex className={styles.contentText} mt="10px" mb="10px">
                Are you sure you want to delete this template?
              </Flex>
              <Flex ml="auto" mt="10px" gap="4">
                <Button className={styles.defaultButton} onClick={() => setDeleteModalopen(false)}>
                  Cancel
                </Button>
                <Button className={styles.deleteModalButton} onClick={handleDelete}>
                  Delete
                </Button>
              </Flex>
            </Flex>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* template dialog */}
      <Dialog.Root open={templateModalOpen} onOpenChange={setTemplateModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.dialogOverlay} />
          <Dialog.Content className={styles.dialogContent}>
            <Dialog.Title />
            <Flex direction="column" style={{ gap: '10px' }}>
              <Flex className={styles.templatesTitle}>Update Template</Flex>
              <Flex className={styles.contentText} mb="10px" align="center">
                <span className={styles.modalText}>ID: cm4a9asxt00b412wmkrouogm0</span>
              </Flex>
              <Flex direction={isResponsive ? 'column' : 'row'} style={{ gap: '10px' }}>
                <FormInput id="templateName" label="Template Name" type="text" required />
                <FormInput id="containerImage" label="Container Image" type="text" required />
              </Flex>
              <Flex>
                <FormTextArea id="description" label="Description(MarkDown)" required />
              </Flex>

              <Accordion.Root type="multiple">
                <Accordion.Item value="ports" className={styles.templateAccordionItem}>
                  <Accordion.Trigger className={styles.templateAccordionTrigger}>
                    <Flex align="center" gap="2" className={styles.templateAccordionButton}>
                      <Flex style={{ gap: '10px', alignItems: 'center' }}>
                        <PortIcon />
                        <Flex>Ports</Flex>
                      </Flex>
                      <ChevronDownIcon className={styles.chevronIcon} aria-hidden />
                    </Flex>
                  </Accordion.Trigger>
                  <Accordion.Content>
                    <Flex direction={isResponsive ? 'column' : 'row'} className={styles.templateAccordionContent}>
                      <FormInput id="httpPorts" label="HTTP Ports" placeholder="80, 8080" type="text" />
                      <FormInput id="tcpPorts" label="TCP Ports" placeholder="22, 3306" type="text" />
                    </Flex>
                  </Accordion.Content>
                </Accordion.Item>

                <Accordion.Item value="addVariables" className={styles.templateAccordionItem}>
                  <Accordion.Trigger className={styles.templateAccordionTrigger}>
                    <Flex align="center" gap="2" className={styles.templateAccordionButton}>
                      <Flex style={{ gap: '10px', alignItems: 'center' }}>
                        <VariableIcon />
                        <Flex>Add Variables</Flex>
                      </Flex>
                      <ChevronDownIcon className={styles.chevronIcon} aria-hidden />
                    </Flex>
                  </Accordion.Trigger>
                  <Accordion.Content>
                    <Flex direction="column" className={styles.templateAccordionContent}>
                      {fields.map((field, index) => (
                        <Flex gap="10px" key={index}>
                          <FormInput
                            id={`key-${index}`}
                            label="Key"
                            placeholder="key"
                            type="text"
                            value={field.key}
                            onChange={(e) => handleFieldChange(index, 'key', e.target.value)}
                          />
                          <FormInput
                            id={`value-${index}`}
                            label="Value"
                            placeholder="value"
                            type="text"
                            value={field.value}
                            onChange={(e) => handleFieldChange(index, 'value', e.target.value)}
                          />
                          <Button className={styles.iconButton}>
                            <VariableIcon />
                          </Button>
                          <Button className={styles.iconButton} onClick={() => handleRemoveField(index)}>
                            <DeleteIcon />
                          </Button>
                        </Flex>
                      ))}
                      <Flex width="20%">
                        <Button className={styles.defaultButton} onClick={handleAddField}>
                          Add Variable
                        </Button>
                      </Flex>
                    </Flex>
                  </Accordion.Content>
                </Accordion.Item>

                <Accordion.Item value="gpuRequrements" className={styles.templateAccordionItem}>
                  <Accordion.Trigger className={styles.templateAccordionTrigger}>
                    <Flex align="center" gap="2" className={styles.templateAccordionButton}>
                      <Flex style={{ gap: '10px', alignItems: 'center' }}>
                        <FilterIcon />
                        <Flex>GPU Requirements</Flex>
                      </Flex>
                      <ChevronDownIcon className={styles.chevronIcon} aria-hidden />
                    </Flex>
                  </Accordion.Trigger>
                  <Accordion.Content>
                    <Flex direction="column" className={styles.templateAccordionContent}>
                      <FormSelect
                        id="compatibleCPUTypes"
                        name="compatibleCPUTypes"
                        label="Compatible CPU Types"
                        items={dummyValue}
                        defaultValue="8"
                        className={styles.selectBox}
                      />

                      <FormSelect
                        id="validCPUCounts"
                        name="validCPUCounts"
                        label="Valid CPU Counts"
                        items={dummyValue}
                        defaultValue="8"
                        className={styles.selectBox}
                      />

                      <FormSelect
                        id="validSocketTypes"
                        name="validSocketTypes"
                        label="Valid Socket Types"
                        items={dummyValue}
                        defaultValue="8"
                        className={styles.selectBox}
                      />

                      <FormSelect
                        id="unsupportedProviders"
                        name="unsupportedProviders"
                        label="Unsupported Providers"
                        items={dummyValue}
                        defaultValue="8"
                        className={styles.selectBox}
                      />

                      <Flex className={styles.computeType}>Compute Types</Flex>
                      <Flex justify="between" className={styles.instanceArea} p="4">
                        <div className={styles.contentTextWhite}>Show Spot Instances</div>
                        <Switch.Root className={styles.switchRoot} id="spotInstance">
                          <Switch.Thumb className={styles.switchThumb} />
                        </Switch.Root>
                      </Flex>
                    </Flex>
                  </Accordion.Content>
                </Accordion.Item>

                <Accordion.Item value="advanced" className={styles.templateAccordionItem}>
                  <Accordion.Trigger className={styles.templateAccordionTrigger}>
                    <Flex align="center" gap="2" className={styles.templateAccordionButton}>
                      <Flex style={{ gap: '10px', alignItems: 'center' }}>
                        <SettingsIcon />
                        <Flex>Advanced</Flex>
                      </Flex>
                      <ChevronDownIcon className={styles.chevronIcon} aria-hidden />
                    </Flex>
                  </Accordion.Trigger>
                  <Accordion.Content>
                    <Flex direction="column" className={styles.templateAccordionContent}>
                      <Flex direction="column">
                        <Flex className={styles.contentTextWhite}>Container Start Script</Flex>
                        <Flex className={styles.subTitle}>
                          This script will be executed as the entrypoint when the container starts. It should be written
                          as a bash script
                        </Flex>
                        <FormInput id="containerStartScript" placeholder="#!/bin/bash" type="text" />
                      </Flex>

                      <Flex direction="column">
                        <Flex className={styles.contentTextWhite}>Registry</Flex>
                        <Flex className={styles.subTitle}>
                          Choose the container registry to pull the image from. Select &apos;Docker Hub&apos; for public
                          images or a custom registry for private images.
                        </Flex>
                        <FormSelect
                          id="registry"
                          name="registry"
                          items={dummyValue}
                          defaultValue="8"
                          className={styles.selectBox}
                        />
                      </Flex>

                      <Flex direction="column">
                        <Flex className={styles.contentTextWhite}>Visibility</Flex>
                        <Flex className={styles.subTitle}>
                          Set the visibility of your template. Private templates are only accessible to you, while
                          public templates can be used by all users after an approval process.
                        </Flex>
                        <FormSelect
                          id="visibility"
                          name="visibility"
                          items={dummyValue}
                          defaultValue="8"
                          className={styles.selectBox}
                        />
                      </Flex>
                    </Flex>
                  </Accordion.Content>
                </Accordion.Item>
              </Accordion.Root>

              <Flex ml="auto" mt="10px" gap="10px">
                <Button className={styles.defaultButton} onClick={() => setTemplateModalOpen(false)}>
                  Cancel
                </Button>
                <Button className={styles.confirmButton} onClick={handleSubmit}>
                  Update
                </Button>
              </Flex>
            </Flex>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* registry dialog */}
      <Dialog.Root open={registryModalOpen} onOpenChange={setRegistryModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.dialogOverlay} />
          <Dialog.Content className={styles.dialogContent}>
            <Dialog.Title />
            <Flex direction="column" style={{ gap: '20px' }}>
              <Flex className={styles.templatesTitle}>Create a New Registry</Flex>

              <Flex direction="column" style={{ gap: '10px' }}>
                <FormInput id="registryName" label="Name" type="text" placeholder="Name" required />
              </Flex>
              <Flex direction="column" style={{ gap: '10px' }}>
                <FormInput id="registryUrl" label="URL (Optional)" placeholder="https://example.com/v1/" type="text" />
              </Flex>
              <Flex direction="column" style={{ gap: '10px' }}>
                <FormInput id="userName" label="UserName" type="text" placeholder="UserName" required />
              </Flex>
              <Flex direction="column" style={{ gap: '10px' }}>
                <FormInput
                  id="password"
                  label="Personal Access Token/Password"
                  type="text"
                  placeholder="Personal Access Token/Password"
                  required
                />
              </Flex>

              <Flex ml="auto" mt="10px" gap="10px">
                <Button className={styles.defaultButton} onClick={() => setRegistryModalOpen(false)}>
                  Cancel
                </Button>
                <Button className={styles.confirmButton}>Create</Button>
              </Flex>
            </Flex>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* secrets dialog */}
      <Dialog.Root open={secretModalOpen} onOpenChange={setSecretModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.dialogOverlay} />
          <Dialog.Content className={styles.dialogContent}>
            <Dialog.Title />
            <Flex direction="column" style={{ gap: '20px' }}>
              <Flex className={styles.templatesTitle}>Create New Secret</Flex>

              <Flex direction="column" style={{ gap: '10px' }}>
                <FormInput id="secretName" label="Name" type="text" placeholder="Name" required />
              </Flex>

              <Flex direction="column">
                <Flex className={styles.contentTextWhite}>Secret Value</Flex>
                <Flex className={styles.subText} mb="5px">
                  Your secret is encrypted using AES encryption with a unique symmetric key, providing the highest level
                  of security for your data.
                </Flex>
                <FormTextArea id="secretValue" placeholder="Enter secret value or upload a file" required />
              </Flex>

              <Flex mr="auto" gap="10px">
                <input id="secretFile" name="secretFile" accept=".txt" type="file" style={{ display: 'none' }} />
                <label htmlFor="secretFile">
                  <Flex className={styles.confirmButton} justify="center" align="center">
                    Upload file
                  </Flex>
                </label>
                <Flex className={styles.subTitle} align="center">
                  {'(max 64 kbit)'}
                </Flex>
              </Flex>

              <Flex direction="column" style={{ gap: '10px' }}>
                <FormInput id="description" label="Description" placeholder="Description" type="text" />
              </Flex>

              <Flex ml="auto" mt="10px" gap="10px">
                <Button className={styles.defaultButton} onClick={() => setSecretModalOpen(false)}>
                  Cancel
                </Button>
                <Button className={styles.confirmButton}>Create</Button>
              </Flex>
            </Flex>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Flex>
  )
}

export default Templates
