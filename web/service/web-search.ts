import { post } from './base'

export type WebSearchResult = {
  title: string
  url: string
  content: string
  score: number
}

export type WebSearchResponse = {
  results: WebSearchResult[]
  answer?: string
}

export const fetchWebSearch = (query: string, numResults = 5) => {
  return post<WebSearchResponse>('/web-search', {
    body: { query, num_results: numResults },
  })
}
