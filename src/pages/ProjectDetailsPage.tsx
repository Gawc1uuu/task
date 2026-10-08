import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Button, CheckboxGroup, Input, Select } from '../design-system'
import {
  getResource,
  hasProjectDetailsErrors,
  isBasicInfoComplete,
  TEAM_MEMBERS,
  updateProjectDetails,
  validateProjectDetails,
  type ProjectDetails,
  type ProjectDetailsFieldErrors,
  type Resource,
} from '../api/resources'
import { useCompletedEdits } from '../state/completedEdits'

const CATEGORY_OPTIONS = [
  { value: '', label: 'Select category' },
  { value: 'internal', label: 'Internal' },
  { value: 'external', label: 'External' },
  { value: 'vendor', label: 'Vendor' },
]

export function ProjectDetailsPage() {
  const { resourceId: resourceIdParam } = useParams()
  const resourceId = Number(resourceIdParam)
  const isValidId = Number.isInteger(resourceId) && resourceId > 0

  const resourceQuery = useQuery({
    queryKey: ['resource', resourceId],
    queryFn: () => getResource(resourceId),
    enabled: isValidId,
  })

  const resource = resourceQuery.data
  const basicInfoMissing = resource?.status === 'draft' && !isBasicInfoComplete(resource.basicInfo)

  return (
    <Page>
      <BackLink to={isValidId ? `/resources/${resourceId}` : '/resources'}>Back to resource</BackLink>
      <h1>Project Details</h1>
      {!isValidId ? <StatusMessage>This resource address is invalid.</StatusMessage> : null}
      {isValidId && resourceQuery.isPending ? <StatusMessage>Loading resource…</StatusMessage> : null}
      {isValidId && resourceQuery.isError ? (
        <StatusMessage>
          {resourceQuery.error instanceof Error
            ? resourceQuery.error.message
            : 'Could not load this resource.'}
        </StatusMessage>
      ) : null}
      {resource && basicInfoMissing ? (
        <StatusMessage>Project Details is available after Basic Info is complete.</StatusMessage>
      ) : null}
      {resource && !basicInfoMissing ? <ProjectDetailsForm resource={resource} /> : null}
    </Page>
  )
}

function ProjectDetailsForm({ resource }: { resource: Resource }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const stageProjectDetails = useCompletedEdits((state) => state.stageProjectDetails)
  const stagedProjectDetails = useCompletedEdits((state) => state.byId[resource.resourceId]?.projectDetails)
  const initialProjectDetails =
    resource.status === 'completed' && stagedProjectDetails ? stagedProjectDetails : resource.projectDetails
  const [projectName, setProjectName] = useState(initialProjectDetails.projectName)
  const [budget, setBudget] = useState(initialProjectDetails.budget)
  const [category, setCategory] = useState(initialProjectDetails.category)
  const [options, setOptions] = useState(initialProjectDetails.options)
  const [errors, setErrors] = useState<ProjectDetailsFieldErrors>({})
  const isCompleted = resource.status === 'completed'

  const saveMutation = useMutation({
    mutationFn: (projectDetails: ProjectDetails) => updateProjectDetails(resource.resourceId, projectDetails),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['resource', resource.resourceId] })
      await queryClient.invalidateQueries({ queryKey: ['resources'] })
      navigate(`/resources/${resource.resourceId}`)
    },
  })

  const serverError = saveMutation.error instanceof Error ? saveMutation.error.message : null

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const projectDetails: ProjectDetails = {
      projectName: projectName.trim(),
      budget: budget.trim(),
      category,
      options,
    }
    const nextErrors = validateProjectDetails(projectDetails)
    setErrors(nextErrors)
    if (hasProjectDetailsErrors(nextErrors)) {
      return
    }
    if (isCompleted) {
      stageProjectDetails(resource.resourceId, projectDetails)
      navigate(`/resources/${resource.resourceId}`)
      return
    }
    saveMutation.mutate(projectDetails)
  }

  return (
    <Form onSubmit={handleSubmit}>
      <Input
        label="Project name"
        name="projectName"
        value={projectName}
        autoFocus
        helperText="Letters, numbers, spaces, and hyphens."
        error={errors.projectName}
        onChange={(event) => {
          setProjectName(event.target.value)
          setErrors((current) => ({ ...current, projectName: undefined }))
          saveMutation.reset()
        }}
      />
      <Input
        label="Budget"
        name="budget"
        value={budget}
        inputMode="numeric"
        helperText="Integers only."
        error={errors.budget}
        onChange={(event) => {
          setBudget(event.target.value)
          setErrors((current) => ({ ...current, budget: undefined }))
          saveMutation.reset()
        }}
      />
      <Select
        label="Category"
        name="category"
        value={category}
        options={CATEGORY_OPTIONS}
        error={errors.category}
        onChange={(event) => {
          setCategory(event.target.value)
          setErrors((current) => ({ ...current, category: undefined }))
          saveMutation.reset()
        }}
      />
      <CheckboxGroup
        label="Team"
        options={[...TEAM_MEMBERS]}
        value={options}
        helper="Select at least one."
        error={errors.options}
        onChange={(next) => {
          setOptions(next)
          setErrors((current) => ({ ...current, options: undefined }))
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
