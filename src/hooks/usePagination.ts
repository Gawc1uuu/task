import { useCallback, useState } from 'react'

export function usePagination(initialPageSize = 10) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const changePage = useCallback((nextPage: number) => {
    setPage(Math.max(1, nextPage))
  }, [])

  const changePageSize = useCallback((nextPageSize: number) => {
    setPageSize(nextPageSize)
    setPage(1)
  }, [])

  const resetPage = useCallback(() => {
    setPage(1)
  }, [])

  return { page, pageSize, changePage, changePageSize, resetPage }
}
