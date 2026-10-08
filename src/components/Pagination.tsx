import type { ChangeEvent } from 'react'
import styled from 'styled-components'
import { Button, Select } from '../design-system'

const PAGE_SIZE_OPTIONS = [5, 10, 15, 30, 50, 100]

type PaginationProps = {
  page: number
  totalPages: number
  pageSize: number
  pageSizeOptions?: number[]
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

export function Pagination({
  page,
  totalPages,
  pageSize,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const safeTotalPages = Math.max(1, totalPages)

  function handlePageSizeChange(event: ChangeEvent<HTMLSelectElement>) {
    onPageSizeChange(Number(event.target.value))
  }

  return (
    <Pager>
      <PagerButtons>
        <Button
          type="button"
          variant="secondary"
          size="small"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <PagerLabel>
          Page {page} of {safeTotalPages}
        </PagerLabel>
        <Button
          type="button"
          variant="secondary"
          size="small"
          disabled={page >= safeTotalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </PagerButtons>
      <PageSizeField>
        <Select
          label="Per page"
          value={String(pageSize)}
          options={pageSizeOptions.map((size) => ({
            value: String(size),
            label: String(size),
          }))}
          onChange={handlePageSizeChange}
        />
      </PageSizeField>
    </Pager>
  )
}

const Pager = styled.nav`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
`

const PagerButtons = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`

const PagerLabel = styled.span`
  color: ${({ theme }) => theme.colors.inkMuted};
`

const PageSizeField = styled.div`
  width: 120px;
`
