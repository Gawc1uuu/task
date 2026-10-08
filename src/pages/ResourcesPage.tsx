import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import styled from 'styled-components'
import { Pagination } from '../components/Pagination'
import { Badge, Button, Card, Drawer, Input, Select } from '../design-system'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { usePagination } from '../hooks/usePagination'
import {
  createResource,
  listResources,
  validateResourceName,
  type Resource,
  type ResourceSortOrder,
  type ResourceStatus,
} from '../api/resources'

const SORT_OPTIONS: { value: ResourceSortOrder; label: string }[] = [
  { value: 'desc', label: 'Newest first' },
  { value: 'asc', label: 'Oldest first' },
]
const STATUS_OPTIONS: { value: '' | ResourceStatus; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'completed', label: 'Completed' },
]

export function ResourcesPage() {
  const queryClient = useQueryClient()
  const { page, pageSize, changePage, changePageSize, resetPage } = usePagination()
  const [sortOrder, setSortOrder] = useState<ResourceSortOrder>('desc')
  const [nameInput, setNameInput] = useState('')
  const nameFilter = useDebouncedValue(nameInput.trim(), 300)
  const [statusFilter, setStatusFilter] = useState<'' | ResourceStatus>('')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [name, setName] = useState('')
  const [clientError, setClientError] = useState<string | null>(null)

  const previousNameFilter = useRef(nameFilter)

  useEffect(() => {
    if (previousNameFilter.current === nameFilter) {
      return
    }
    previousNameFilter.current = nameFilter
    resetPage()
  }, [nameFilter, resetPage])

  const resourcesQuery = useQuery({
    queryKey: ['resources', page, pageSize, sortOrder, nameFilter, statusFilter],
    queryFn: () =>
      listResources(page, pageSize, sortOrder, {
        name: nameFilter,
        status: statusFilter || undefined,
      }),
    placeholderData: keepPreviousData,
  })

  const createMutation = useMutation({
    mutationFn: createResource,
    onSuccess: async () => {
      resetPage()
      setName('')
      setClientError(null)
      setIsDrawerOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['resources'] })
    },
  })

  const items = resourcesQuery.data?.items ?? []
  const pagination = resourcesQuery.data?.pagination
  const nameError =
    clientError ?? (createMutation.error instanceof Error ? createMutation.error.message : null)

  function openDrawer() {
    setName('')
    setClientError(null)
    createMutation.reset()
    setIsDrawerOpen(true)
  }

  function closeDrawer() {
    if (createMutation.isPending) {
      return
    }
    setIsDrawerOpen(false)
  }

  function handleSortChange(event: ChangeEvent<HTMLSelectElement>) {
    setSortOrder(event.target.value === 'asc' ? 'asc' : 'desc')
    resetPage()
  }

  function handleStatusChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextStatus = event.target.value
    setStatusFilter(nextStatus === 'completed' || nextStatus === 'draft' ? nextStatus : '')
    resetPage()
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const error = validateResourceName(name)
    if (error) {
      setClientError(error)
      return
    }
    createMutation.mutate(name.trim())
  }

  return (
    <Page>
      <Header>
        <h1>Resources</h1>
        <Button type="button" onClick={openDrawer}>
          New resource
        </Button>
      </Header>

      <Filters>
        <NameFilter>
          <Input
            label="Name"
            name="nameFilter"
            value={nameInput}
            placeholder="Search by name"
            onChange={(event) => setNameInput(event.target.value)}
          />
        </NameFilter>
        <StatusFilter>
          <Select
            label="Status"
            value={statusFilter}
            options={STATUS_OPTIONS}
            onChange={handleStatusChange}
          />
        </StatusFilter>
        <OrderFilter>
          <Select
            label="Order"
            value={sortOrder}
            options={SORT_OPTIONS}
            onChange={handleSortChange}
          />
        </OrderFilter>
      </Filters>

      <ListRegion>
        {resourcesQuery.isPending ? <StatusMessage>Loading resources…</StatusMessage> : null}
        {resourcesQuery.isError ? (
          <StatusMessage>Could not load resources. Check that the API is running.</StatusMessage>
        ) : null}
        {resourcesQuery.isSuccess && items.length === 0 ? (
          <StatusMessage>
            {nameFilter || statusFilter
              ? 'No resources match these filters.'
              : 'No resources yet. Create the first one.'}
          </StatusMessage>
        ) : null}
        {items.length > 0 ? (
          <List>
            {items.map((resource) => (
              <ResourceCard key={resource._id} resource={resource} />
            ))}
          </List>
        ) : null}
      </ListRegion>

      <Pagination
        page={pagination?.page ?? page}
        totalPages={pagination?.totalPages ?? 1}
        pageSize={pageSize}
        onPageChange={changePage}
        onPageSizeChange={changePageSize}
      />

      <Drawer title="New resource" isOpen={isDrawerOpen} onClose={closeDrawer}>
        <CreateForm onSubmit={handleSubmit}>
          <Input
            label="Name"
            name="resourceName"
            value={name}
            autoFocus
            error={nameError ?? undefined}
            helperText="Letters, numbers, spaces, and hyphens."
            onChange={(event) => {
              setName(event.target.value)
              setClientError(null)
              createMutation.reset()
            }}
          />
          <Button type="submit" fullWidth disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating…' : 'Create'}
          </Button>
        </CreateForm>
      </Drawer>
    </Page>
  )
}

function ResourceCard({ resource }: { resource: Resource }) {
  return (
    <Card variant="elevated">
      <CardRow>
        <ResourceName>{resource.name}</ResourceName>
        <Badge variant={resource.status === 'completed' ? 'success' : 'info'}>{resource.status}</Badge>
      </CardRow>
      <Meta>Added {formatCreatedAt(resource.createdAt)}</Meta>
    </Card>
  )
}

function formatCreatedAt(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString()
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

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
`

const Filters = styled.div`
  display: flex;
  align-items: flex-end;
  gap: ${({ theme }) => theme.spacing.md};
`

const NameFilter = styled.div`
  flex: 1;
`

const StatusFilter = styled.div`
  width: 180px;
`

const OrderFilter = styled.div`
  width: 200px;
`

const ListRegion = styled.section`
  display: flex;
  flex-direction: column;
`

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`

const StatusMessage = styled.p`
  color: ${({ theme }) => theme.colors.inkMuted};
`

const CardRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
`

const ResourceName = styled.h2`
  font-size: 1.15rem;
`

const Meta = styled.p`
  margin-top: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.inkMuted};
  font-size: 0.95rem;
`

const CreateForm = styled.form`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
`
