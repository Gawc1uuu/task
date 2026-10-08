import { apiRequest } from './http'

export type ResourceStatus = 'draft' | 'completed'

export interface BasicInfo {
  resourceName: string
  owner: string
  email: string
  description: string
  priority: string
}

export interface ProjectDetails {
  projectName: string
  budget: string
  category: string
  options: string[]
}

export interface Resource {
  _id: string
  resourceId: number
  name: string
  status: ResourceStatus
  basicInfo: BasicInfo
  projectDetails: ProjectDetails
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
const OWNER_PATTERN = /^[A-Za-z ]+$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const INTEGER_PATTERN = /^\d+$/

export const PRIORITIES = ['low', 'medium', 'high'] as const
export const PROJECT_CATEGORIES = ['internal', 'external', 'vendor'] as const
export const TEAM_MEMBERS = ['FE devs', 'BE devs', 'Designer', 'Data Eng', 'Product Owner'] as const

export interface ProjectDetailsFieldErrors {
  projectName?: string
  budget?: string
  category?: string
  options?: string
}

export interface BasicInfoFieldErrors {
  owner?: string
  email?: string
  description?: string
  priority?: string
}

export function validateBasicInfo(value: BasicInfo): BasicInfoFieldErrors {
  const errors: BasicInfoFieldErrors = {}
  const owner = value.owner.trim()
  if (!owner) {
    errors.owner = 'Owner is required'
  } else if (owner.length > 255) {
    errors.owner = 'Owner must be at most 255 characters'
  } else if (!OWNER_PATTERN.test(owner)) {
    errors.owner = 'Owner can contain only letters and spaces'
  }

  const email = value.email.trim()
  if (!email) {
    errors.email = 'Email is required'
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Email must be a valid email'
  }

  const description = value.description.trim()
  if (!description) {
    errors.description = 'Description is required'
  } else if (description.length > 1000) {
    errors.description = 'Description must be at most 1000 characters'
  }

  if (!PRIORITIES.includes(value.priority as (typeof PRIORITIES)[number])) {
    errors.priority = 'Priority must be one of: low, medium, high'
  }

  return errors
}

export function hasBasicInfoErrors(errors: BasicInfoFieldErrors) {
  return Object.values(errors).some(Boolean)
}

export function validateProjectDetails(value: ProjectDetails): ProjectDetailsFieldErrors {
  const errors: ProjectDetailsFieldErrors = {}
  const projectName = value.projectName.trim()
  if (!projectName) {
    errors.projectName = 'Project name is required'
  } else if (projectName.length > 255) {
    errors.projectName = 'Project name must be at most 255 characters'
  } else if (!NAME_PATTERN.test(projectName)) {
    errors.projectName = 'Project name can contain only letters, numbers, spaces, and hyphens'
  }

  const budget = value.budget.trim()
  if (!budget) {
    errors.budget = 'Budget is required'
  } else if (!INTEGER_PATTERN.test(budget)) {
    errors.budget = 'Budget must contain only integers'
  }

  if (!PROJECT_CATEGORIES.includes(value.category as (typeof PROJECT_CATEGORIES)[number])) {
    errors.category = 'Category must be one of: internal, external, vendor'
  }

  if (value.options.length === 0) {
    errors.options = 'At least one team member is required'
  } else if (
    value.options.some(
      (option) => !TEAM_MEMBERS.includes(option as (typeof TEAM_MEMBERS)[number]),
    )
  ) {
    errors.options = 'Choose a team member from the list'
  }

  return errors
}

export function hasProjectDetailsErrors(errors: ProjectDetailsFieldErrors) {
  return Object.values(errors).some(Boolean)
}

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

export function getResource(resourceId: number): Promise<Resource> {
  return apiRequest<Resource>(`/api/resources/${resourceId}`)
}

export function isBasicInfoComplete(basicInfo: BasicInfo) {
  return Boolean(
    basicInfo.resourceName &&
      basicInfo.owner &&
      basicInfo.email &&
      basicInfo.description &&
      basicInfo.priority,
  )
}

export function isProjectDetailsComplete(projectDetails: ProjectDetails) {
  return Boolean(
    projectDetails.projectName &&
      projectDetails.budget &&
      projectDetails.category &&
      projectDetails.options.length > 0,
  )
}

export function createResource(resourceName: string): Promise<Resource> {
  return apiRequest<Resource>('/api/resources', {
    method: 'POST',
    body: JSON.stringify({ resourceName }),
  })
}

export function updateBasicInfo(resourceId: number, basicInfo: BasicInfo): Promise<Resource> {
  return apiRequest<Resource>(`/api/resources/${resourceId}/basic-info`, {
    method: 'PATCH',
    body: JSON.stringify(basicInfo),
  })
}

export function updateProjectDetails(
  resourceId: number,
  projectDetails: ProjectDetails,
): Promise<Resource> {
  return apiRequest<Resource>(`/api/resources/${resourceId}/project-details`, {
    method: 'PATCH',
    body: JSON.stringify(projectDetails),
  })
}

export interface ReplaceResourceInput {
  name: string
  basicInfo: BasicInfo
  projectDetails: ProjectDetails
}

export function replaceResource(
  resourceId: number,
  resource: ReplaceResourceInput,
): Promise<Resource> {
  return apiRequest<Resource>(`/api/resources/${resourceId}`, {
    method: 'PUT',
    body: JSON.stringify(resource),
  })
}

export function provisionResource(resourceId: number): Promise<Resource> {
  return apiRequest<Resource>(`/api/resources/${resourceId}/provisioning`, {
    method: 'PATCH',
  })
}

export function deleteResource(resourceId: number): Promise<Resource> {
  return apiRequest<Resource>(`/api/resources/${resourceId}`, {
    method: 'DELETE',
  })
}
