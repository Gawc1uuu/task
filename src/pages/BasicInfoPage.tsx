import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Button, Input, Select } from '../design-system'
import {
  getResource,
  hasBasicInfoErrors,
  PRIORITIES,
  updateBasicInfo,
  validateBasicInfo,
  type BasicInfo,
  type BasicInfoFieldErrors,
  type Resource,
} from '../api/resources'
import { useCompletedEdits } from '../state/completedEdits'

const PRIORITY_OPTIONS = [
  { value: '', label: 'Select priority' },
  ...PRIORITIES.map((priority) => ({
    value: priority,
    label: priority.charAt(0).toUpperCase() + priority.slice(1),
  })),
]

export function BasicInfoPage() {
  const { resourceId: resourceIdParam } = useParams()
  const resourceId = Number(resourceIdParam)
  const isValidId = Number.isInteger(resourceId) && resourceId > 0

  const resourceQuery = useQuery({
    queryKey: ['resource', resourceId],
    queryFn: () => getResource(resourceId),
    enabled: isValidId,
  })

  return (
    <Page>
      <BackLink to={isValidId ? `/resources/${resourceId}` : '/resources'}>Back to resource</BackLink>
      <h1>Basic Info</h1>
      {!isValidId ? <StatusMessage>This resource address is invalid.</StatusMessage> : null}
      {isValidId && resourceQuery.isPending ? <StatusMessage>Loading resource…</StatusMessage> : null}
      {isValidId && resourceQuery.isError ? (
        <StatusMessage>
          {resourceQuery.error instanceof Error
            ? resourceQuery.error.message
            : 'Could not load this resource.'}
        </StatusMessage>
      ) : null}
      {resourceQuery.data ? <BasicInfoForm resource={resourceQuery.data} /> : null}
    </Page>
  )
}

function BasicInfoForm({ resource }: { resource: Resource }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const stageBasicInfo = useCompletedEdits((state) => state.stageBasicInfo)
  const stagedBasicInfo = useCompletedEdits((state) => state.byId[resource.resourceId]?.basicInfo)
  const initialBasicInfo =
    resource.status === 'completed' && stagedBasicInfo ? stagedBasicInfo : resource.basicInfo
  const resourceName = initialBasicInfo.resourceName || resource.name
  const [owner, setOwner] = useState(initialBasicInfo.owner)
  const [email, setEmail] = useState(initialBasicInfo.email)
  const [description, setDescription] = useState(initialBasicInfo.description)
  const [priority, setPriority] = useState(initialBasicInfo.priority)
  const [errors, setErrors] = useState<BasicInfoFieldErrors>({})
  const isCompleted = resource.status === 'completed'

  const saveMutation = useMutation({
    mutationFn: (basicInfo: BasicInfo) => updateBasicInfo(resource.resourceId, basicInfo),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['resource', resource.resourceId] })
      await queryClient.invalidateQueries({ queryKey: ['resources'] })
      navigate(`/resources/${resource.resourceId}`)
    },
  })

  const serverError = saveMutation.error instanceof Error ? saveMutation.error.message : null

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const basicInfo: BasicInfo = {
      resourceName,
      owner: owner.trim(),
      email: email.trim(),
      description: description.trim(),
      priority,
    }
    const nextErrors = validateBasicInfo(basicInfo)
    setErrors(nextErrors)
    if (hasBasicInfoErrors(nextErrors)) {
      return
    }
    if (isCompleted) {
      stageBasicInfo(resource.resourceId, basicInfo)
      navigate(`/resources/${resource.resourceId}`)
      return
    }
    saveMutation.mutate(basicInfo)
  }

  return (
    <Form onSubmit={handleSubmit}>
      <Input
        label="Resource name"
        name="resourceName"
        value={resourceName}
        state="locked"
        helperText="Name cannot be changed after creation."
      />
      <Input
        label="Owner"
        name="owner"
        value={owner}
        autoFocus
        helperText="Letters and spaces."
        error={errors.owner}
        onChange={(event) => {
          setOwner(event.target.value)
          setErrors((current) => ({ ...current, owner: undefined }))
          saveMutation.reset()
        }}
      />
      <Input
        label="Email"
        name="email"
        type="email"
        value={email}
        error={errors.email}
        onChange={(event) => {
          setEmail(event.target.value)
          setErrors((current) => ({ ...current, email: undefined }))
          saveMutation.reset()
        }}
      />
      <Input
        label="Description"
        name="description"
        value={description}
        multiline
        error={errors.description}
        onChange={(event) => {
          setDescription(event.target.value)
          setErrors((current) => ({ ...current, description: undefined }))
          saveMutation.reset()
        }}
      />
      <Select
        label="Priority"
        name="priority"
        value={priority}
        options={PRIORITY_OPTIONS}
        error={errors.priority}
        onChange={(event) => {
          setPriority(event.target.value)
          setErrors((current) => ({ ...current, priority: undefined }))
          saveMutation.reset()
        }}
      />
      {serverError ? <FormError>{serverError}</FormError> : null}
      <Button type="submit" disabled={!isCompleted && saveMutation.isPending}>
        {isCompleted ? 'See result' : saveMutation.isPending ? 'Saving…' : 'Save'}
      </Button>
    </Form>
  )
}

const Page = styled.main`
  box-sizing: border-box;
  width: min(720px, 100%);
  min-height: 100vh;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.lg};
`

const BackLink = styled(Link)`
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 600;
  text-decoration: none;
`

const StatusMessage = styled.p`
  color: ${({ theme }) => theme.colors.inkMuted};
`

const Form = styled.form`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
`

const FormError = styled.p`
  color: ${({ theme }) => theme.colors.warning};
`
