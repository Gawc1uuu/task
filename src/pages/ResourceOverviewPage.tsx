import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Badge, Button, Card } from '../design-system'
import {
  getResource,
  isBasicInfoComplete,
  isProjectDetailsComplete,
  provisionResource,
  replaceResource,
  type Resource,
} from '../api/resources'
import { ResourceFieldList } from '../components/ResourceModuleFields'
import { basicInfoFields, projectDetailsFields } from '../components/resourceFields'
import { hasUnsavedCompletedEdit, mergeCompletedEdit, useCompletedEdits } from '../state/completedEdits'

export function ResourceOverviewPage() {
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
      <BackLink to="/resources">Back to resources</BackLink>
      {!isValidId ? <StatusMessage>This resource address is invalid.</StatusMessage> : null}
      {isValidId && resourceQuery.isPending ? <StatusMessage>Loading resource…</StatusMessage> : null}
      {isValidId && resourceQuery.isError ? (
        <StatusMessage>
          {resourceQuery.error instanceof Error
            ? resourceQuery.error.message
            : 'Could not load this resource.'}
        </StatusMessage>
      ) : null}
      {resourceQuery.data ? <ResourceOverview resource={resourceQuery.data} /> : null}
    </Page>
  )
}

function ResourceOverview({ resource }: { resource: Resource }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const stagedEdit = useCompletedEdits((state) => state.byId[resource.resourceId])
  const clearEdits = useCompletedEdits((state) => state.clear)
  const unsaved = hasUnsavedCompletedEdit(resource, stagedEdit)
  const preview = mergeCompletedEdit(resource, stagedEdit)
  const basicInfoComplete = isBasicInfoComplete(preview.basicInfo)
  const projectDetailsComplete = isProjectDetailsComplete(preview.projectDetails)
  const projectDetailsLocked = resource.status === 'draft' && !basicInfoComplete
  const canProvision = resource.status === 'draft' && basicInfoComplete && projectDetailsComplete

  const confirmMutation = useMutation({
    mutationFn: () =>
      replaceResource(resource.resourceId, {
        name: resource.name,
        basicInfo: preview.basicInfo,
        projectDetails: preview.projectDetails,
      }),
    onSuccess: async () => {
      clearEdits(resource.resourceId)
      await queryClient.invalidateQueries({ queryKey: ['resource', resource.resourceId] })
      await queryClient.invalidateQueries({ queryKey: ['resources'] })
    },
  })

  const provisionMutation = useMutation({
    mutationFn: () => provisionResource(resource.resourceId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['resource', resource.resourceId] })
      await queryClient.invalidateQueries({ queryKey: ['resources'] })
    },
  })

  return (
    <>
      <Header>
        <h1>{resource.name}</h1>
        <HeaderActions>
          <DetailsLink to={`/resources/${resource.resourceId}/details`}>Details</DetailsLink>
          <Badge variant={resource.status === 'completed' ? 'success' : 'info'}>{resource.status}</Badge>
        </HeaderActions>
      </Header>
      {unsaved ? (
        <UnsavedPanel>
          <ModuleNote>You have unsaved changes.</ModuleNote>
          <Button
            type="button"
            disabled={confirmMutation.isPending}
            onClick={() => confirmMutation.mutate()}
          >
            {confirmMutation.isPending ? 'Confirming…' : 'Confirm changes'}
          </Button>
          {confirmMutation.error instanceof Error ? (
            <ProvisionError>{confirmMutation.error.message}</ProvisionError>
          ) : null}
        </UnsavedPanel>
      ) : null}
      <ModuleList>
        <Card variant="elevated">
          <ModuleRow>
            <ModuleName>Basic Info</ModuleName>
            <Badge variant={basicInfoComplete ? 'success' : 'warning'}>
              {basicInfoComplete ? 'Complete' : 'Incomplete'}
            </Badge>
          </ModuleRow>
          <ResourceFieldList fields={basicInfoFields(resource.basicInfo, preview.basicInfo)} />
          <ModuleButton
            type="button"
            variant={basicInfoComplete ? 'secondary' : 'primary'}
            onClick={() => navigate(`/resources/${resource.resourceId}/basic-info`)}
          >
            {basicInfoComplete ? 'Edit' : 'Fill in'}
          </ModuleButton>
        </Card>
        <Card variant="elevated">
          <ModuleRow>
            <ModuleName>Project Details</ModuleName>
            <Badge variant={projectDetailsComplete ? 'success' : 'warning'}>
              {projectDetailsComplete ? 'Complete' : 'Incomplete'}
            </Badge>
          </ModuleRow>
          <ResourceFieldList fields={projectDetailsFields(resource.projectDetails, preview.projectDetails)} />
          <ModuleButton
            type="button"
            variant={projectDetailsComplete ? 'secondary' : 'primary'}
            state={projectDetailsLocked ? 'locked' : 'normal'}
            onClick={() => navigate(`/resources/${resource.resourceId}/project-details`)}
          >
            {projectDetailsComplete ? 'Edit' : 'Fill in'}
          </ModuleButton>
          {projectDetailsLocked ? (
            <ModuleNote>Available after Basic Info is complete.</ModuleNote>
          ) : null}
        </Card>
      </ModuleList>
      <ProvisionRow>
        <Button
          type="button"
          state={canProvision ? 'normal' : 'locked'}
          disabled={provisionMutation.isPending}
          onClick={() => provisionMutation.mutate()}
        >
          {provisionMutation.isPending ? 'Provisioning…' : 'Provision'}
        </Button>
        {resource.status === 'completed' ? (
          <ModuleNote>This resource is already completed.</ModuleNote>
        ) : null}
        {resource.status === 'draft' && !canProvision ? (
          <ModuleNote>Both modules must be complete before provisioning.</ModuleNote>
        ) : null}
        {provisionMutation.error instanceof Error ? (
          <ProvisionError>{provisionMutation.error.message}</ProvisionError>
        ) : null}
      </ProvisionRow>
    </>
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

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
`

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`

const DetailsLink = styled(Link)`
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 600;
  text-decoration: none;
`

const StatusMessage = styled.p`
  color: ${({ theme }) => theme.colors.inkMuted};
`

const ModuleList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`

const ModuleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
`

const ModuleName = styled.h2`
  font-size: 1.05rem;
`

const ModuleButton = styled(Button)`
  width: 100%;
  min-height: 48px;
`

const ModuleNote = styled.p`
  color: ${({ theme }) => theme.colors.inkMuted};
`

const UnsavedPanel = styled.section`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`

const ProvisionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`

const ProvisionError = styled.p`
  color: ${({ theme }) => theme.colors.warning};
`
