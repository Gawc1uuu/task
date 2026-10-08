import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Badge, Card } from '../design-system'
import {
  getResource,
  isBasicInfoComplete,
  isProjectDetailsComplete,
  type Resource,
} from '../api/resources'
import { ResourceFieldList } from '../components/ResourceModuleFields'
import { basicInfoFields, projectDetailsFields } from '../components/resourceFields'
import { hasUnsavedCompletedEdit, mergeCompletedEdit, useCompletedEdits } from '../state/completedEdits'

export function ResourceDetailsPage() {
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
      {!isValidId ? <StatusMessage>This resource address is invalid.</StatusMessage> : null}
      {isValidId && resourceQuery.isPending ? <StatusMessage>Loading resource…</StatusMessage> : null}
      {isValidId && resourceQuery.isError ? (
        <StatusMessage>
          {resourceQuery.error instanceof Error
            ? resourceQuery.error.message
            : 'Could not load this resource.'}
        </StatusMessage>
      ) : null}
      {resourceQuery.data ? <ResourceDetails resource={resourceQuery.data} /> : null}
    </Page>
  )
}

function ResourceDetails({ resource }: { resource: Resource }) {
  const stagedEdit = useCompletedEdits((state) => state.byId[resource.resourceId])
  const unsaved = hasUnsavedCompletedEdit(resource, stagedEdit)
  const preview = mergeCompletedEdit(resource, stagedEdit)
  const basicInfoComplete = isBasicInfoComplete(preview.basicInfo)
  const projectDetailsComplete = isProjectDetailsComplete(preview.projectDetails)

  return (
    <>
      <Header>
        <h1>{preview.name}</h1>
        <Badge variant={preview.status === 'completed' ? 'success' : 'info'}>
          {preview.status === 'completed' ? 'Completed' : 'Draft'}
        </Badge>
      </Header>
      {unsaved ? <StatusMessage>These values include unsaved changes.</StatusMessage> : null}
      <ModuleList>
        <Card variant="elevated">
          <ModuleRow>
            <ModuleName>Basic Info</ModuleName>
            <Badge variant={basicInfoComplete ? 'success' : 'warning'}>
              {basicInfoComplete ? 'Complete' : 'Incomplete'}
            </Badge>
          </ModuleRow>
          <ResourceFieldList fields={basicInfoFields(resource.basicInfo, preview.basicInfo)} />
        </Card>
        <Card variant="elevated">
          <ModuleRow>
            <ModuleName>Project Details</ModuleName>
            <Badge variant={projectDetailsComplete ? 'success' : 'warning'}>
              {projectDetailsComplete ? 'Complete' : 'Incomplete'}
            </Badge>
          </ModuleRow>
          <ResourceFieldList fields={projectDetailsFields(resource.projectDetails, preview.projectDetails)} />
        </Card>
      </ModuleList>
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
