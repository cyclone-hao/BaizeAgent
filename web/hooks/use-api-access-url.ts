import { useMemo } from 'react'
import { useGetLanguage } from '@/context/i18n'

export const useDatasetApiAccessUrl = () => {
  const locale = useGetLanguage()

  const apiReferenceUrl = useMemo(() => {
    return '#'
  }, [locale])

  return apiReferenceUrl
}
