import { apiRequest } from './http'

export type ResourceStatus = 'draft' | 'completed'

export interface Resource {
  _id: string
  resourceId: number
  name: string
  status: ResourceStatus
  createdAt: string
  updatedAt: string
}

export interface ResourceList {
  items: Resource[]
  pagination: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
}

const NAME_PATTERN = /^[A-Za-z0-9 -]+$/

export function validateResourceName(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return 'Name is required'
  }
  if (trimmed.length > 255) {
    return 'Name must be at most 255 characters'
  }
  if (!NAME_PATTERN.test(trimmed)) {
    return 'Name can contain only letters, numbers, spaces, and hyphens'
  }
  return null
}

export type ResourceSortOrder = 'asc' | 'desc'

export function listResources(
  page: number,
  pageSize: number,
  sortOrder: ResourceSortOrder,
  filters?: { name?: string; status?: ResourceStatus },
): Promise<ResourceList> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    sortOrder,
  })
  const name = filters?.name?.trim()
  if (name) {
    params.set('name', escapeRegExp(name))
  }
  if (filters?.status) {
    params.set('status', filters.status)
  }
  return apiRequest<ResourceList>(`/api/resources?${params.toString()}`)
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function createResource(resourceName: string): Promise<Resource> {
  return apiRequest<Resource>('/api/resources', {
    method: 'POST',
    body: JSON.stringify({ resourceName }),
  })
}
