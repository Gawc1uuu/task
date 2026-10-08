import type { BasicInfo, ProjectDetails } from '../api/resources'

export type FieldItem = {
  label: string
  value: string
  saved: string
  changed: boolean
}

export function basicInfoFields(saved: BasicInfo, preview: BasicInfo): FieldItem[] {
  return [
    field('Resource name', preview.resourceName, saved.resourceName),
    field('Owner', preview.owner, saved.owner),
    field('Email', preview.email, saved.email),
    field('Description', preview.description, saved.description),
    field('Priority', preview.priority, saved.priority),
  ]
}

export function projectDetailsFields(saved: ProjectDetails, preview: ProjectDetails): FieldItem[] {
  return [
    field('Project name', preview.projectName, saved.projectName),
    field('Budget', preview.budget, saved.budget),
    field('Category', preview.category, saved.category),
    field('Team', preview.options.join(', '), saved.options.join(', ')),
  ]
}

function field(label: string, value: string, saved: string): FieldItem {
  return { label, value, saved, changed: value !== saved }
}
