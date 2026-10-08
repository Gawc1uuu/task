import styled from 'styled-components'
import type { FieldItem } from './resourceFields'

export function ResourceFieldList({ fields }: { fields: FieldItem[] }) {
  return (
    <Fields>
      {fields.map((field) => (
        <Field key={field.label}>
          <FieldLabel>{field.label}</FieldLabel>
          <FieldValue $changed={field.changed} $empty={!field.changed && field.value.length === 0}>
            {field.value || '—'}
          </FieldValue>
          {field.changed ? <SavedValue>Saved: {field.saved || '—'}</SavedValue> : null}
        </Field>
      ))}
    </Fields>
  )
}

const Fields = styled.dl`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
`

const Field = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xs};
`

const FieldLabel = styled.dt`
  color: ${({ theme }) => theme.colors.inkMuted};
  font-size: 0.85rem;
`

const FieldValue = styled.dd<{ $changed: boolean; $empty: boolean }>`
  color: ${({ theme, $changed, $empty }) =>
    $changed ? theme.colors.warning : $empty ? theme.colors.inkMuted : theme.colors.ink};
  font-weight: ${({ $changed }) => ($changed ? 700 : 400)};
`

const SavedValue = styled.dd`
  color: ${({ theme }) => theme.colors.inkMuted};
  font-size: 0.85rem;
`
