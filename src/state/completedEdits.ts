import { create } from 'zustand'
import type { BasicInfo, ProjectDetails, Resource } from '../api/resources'

type CompletedEdit = {
  basicInfo?: BasicInfo
  projectDetails?: ProjectDetails
}

type CompletedEditsState = {
  byId: Record<number, CompletedEdit>
  stageBasicInfo: (resourceId: number, basicInfo: BasicInfo) => void
  stageProjectDetails: (resourceId: number, projectDetails: ProjectDetails) => void
  clear: (resourceId: number) => void
}

export const useCompletedEdits = create<CompletedEditsState>((set) => ({
  byId: {},
  stageBasicInfo: (resourceId, basicInfo) =>
    set((state) => ({
      byId: {
        ...state.byId,
        [resourceId]: { ...state.byId[resourceId], basicInfo },
      },
    })),
  stageProjectDetails: (resourceId, projectDetails) =>
    set((state) => ({
      byId: {
        ...state.byId,
        [resourceId]: { ...state.byId[resourceId], projectDetails },
      },
    })),
  clear: (resourceId) =>
    set((state) => {
      const byId = { ...state.byId }
      delete byId[resourceId]
      return { byId }
    }),
}))

export function mergeCompletedEdit(resource: Resource, edit?: CompletedEdit) {
  if (!edit) {
    return resource
  }
  return {
    ...resource,
    basicInfo: edit.basicInfo ?? resource.basicInfo,
    projectDetails: edit.projectDetails ?? resource.projectDetails,
  }
}

export function hasUnsavedCompletedEdit(resource: Resource, edit?: CompletedEdit) {
  if (!edit) {
    return false
  }
  const basicInfoChanged = edit.basicInfo !== undefined && !sameBasicInfo(edit.basicInfo, resource.basicInfo)
  const projectDetailsChanged =
    edit.projectDetails !== undefined && !sameProjectDetails(edit.projectDetails, resource.projectDetails)
  return basicInfoChanged || projectDetailsChanged
}

function sameBasicInfo(left: BasicInfo, right: BasicInfo) {
  return (
    left.resourceName === right.resourceName &&
    left.owner === right.owner &&
    left.email === right.email &&
    left.description === right.description &&
    left.priority === right.priority
  )
}

function sameProjectDetails(left: ProjectDetails, right: ProjectDetails) {
  return (
    left.projectName === right.projectName &&
    left.budget === right.budget &&
    left.category === right.category &&
    left.options.join('\n') === right.options.join('\n')
  )
}
