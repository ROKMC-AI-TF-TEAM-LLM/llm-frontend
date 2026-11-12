// mock-docs/의 PDF에서 질문과 관련된 쪽을 찾는다. 실제 백엔드의 문서 검색(RAG)을 단순하게 흉내 낸 것이다.
//
// - 쪽마다 글자를 뽑아 메모리에 둔다. 파일 크기나 수정 시각이 바뀌면 다시 뽑는다.
// - 점수는 BM25. 단어 대신 글자 묶음(한글 2글자, 그 밖의 글자 3글자)을 쓴다.
//   PDF에서 뽑은 영문은 띄어쓰기가 빠지는 경우가 많고, 한글은 조사가 붙어 단어 단위 비교가 잘 맞지 않기 때문이다.
// - 실제 백엔드의 임베딩 검색보다 정확도는 낮다. 화면과 흐름을 확인하는 용도다.
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { extractText, getDocumentProxy } from 'unpdf'
import { listDocs, type MockDocFile } from './docsServer'

export interface DocPage {
  domain: string
  name: string
  /** 1부터 시작하는 쪽 번호 */
  page: number
  text: string
}

interface IndexedPage extends DocPage {
  /** 글자 묶음별 등장 횟수 */
  counts: Map<string, number>
  length: number
}

const HANGUL = /[가-힣]/

/** 글을 비교용 글자 묶음으로 나눈다 */
const grams = (text: string): string[] => {
  const out: string[] = []
  for (const run of text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []) {
    const size = HANGUL.test(run) ? 2 : 3
    if (run.length < size) {
      if (run.length >= 2) out.push(run)
      continue
    }
    for (let i = 0; i + size <= run.length; i++)
      out.push(run.slice(i, i + size))
  }
  return out
}

const indexPage = (page: DocPage): IndexedPage => {
  const counts = new Map<string, number>()
  const all = grams(page.text)
  for (const gram of all) counts.set(gram, (counts.get(gram) ?? 0) + 1)
  return { ...page, counts, length: all.length }
}

/** 파일 경로 → (파일 상태, 뽑은 쪽들). 같은 파일을 동시에 여러 번 뽑지 않도록 Promise를 둔다 */
const cache = new Map<string, { key: string; pages: Promise<IndexedPage[]> }>()

const pagesOf = (root: string, file: MockDocFile): Promise<IndexedPage[]> => {
  if (path.extname(file.name).toLowerCase() !== '.pdf')
    return Promise.resolve([])
  const filePath = path.join(root, file.domain, file.name)
  const key = `${file.size}:${file.modifiedAt}`
  const hit = cache.get(filePath)
  if (hit?.key === key) return hit.pages

  const pages = (async () => {
    const pdf = await getDocumentProxy(new Uint8Array(await readFile(filePath)))
    const { text } = await extractText(pdf, { mergePages: false })
    return text
      .map((pageText, i) =>
        indexPage({
          domain: file.domain,
          name: file.name,
          page: i + 1,
          text: pageText.trim(),
        }),
      )
      .filter((page) => page.text !== '')
  })().catch((error: unknown) => {
    // 읽지 못한 파일은 검색에서 빼고, 다음 요청에서 다시 시도한다
    cache.delete(filePath)
    console.warn(
      `  [mock] PDF를 읽지 못했습니다: ${file.name} (${String(error)})`,
    )
    return []
  })
  cache.set(filePath, { key, pages })
  return pages
}

const K1 = 1.2
const B = 0.75

/**
 * 질문과 관련된 쪽을 점수 높은 순으로 돌려준다.
 * domain이 있으면 그 분야 문서에서만, 없으면 모든 문서에서 찾는다.
 */
export const searchPages = async (
  root: string,
  question: string,
  domain: string | undefined,
  limit: number,
): Promise<DocPage[]> => {
  const files = (await listDocs(root)).filter(
    (file) => !domain || file.domain === domain,
  )
  const pages = (
    await Promise.all(files.map((file) => pagesOf(root, file)))
  ).flat()
  const terms = [...new Set(grams(question))]
  if (pages.length === 0 || terms.length === 0) return []

  const averageLength =
    pages.reduce((sum, page) => sum + page.length, 0) / pages.length
  const idf = new Map(
    terms.map((term) => {
      const df = pages.filter((page) => page.counts.has(term)).length
      return [term, Math.log(1 + (pages.length - df + 0.5) / (df + 0.5))]
    }),
  )

  return pages
    .map((page) => {
      let score = 0
      for (const term of terms) {
        const tf = page.counts.get(term)
        if (!tf) continue
        score +=
          (idf.get(term) ?? 0) *
          ((tf * (K1 + 1)) /
            (tf + K1 * (1 - B + (B * page.length) / averageLength)))
      }
      return { page, score }
    })
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ page }) => ({
      domain: page.domain,
      name: page.name,
      page: page.page,
      text: page.text,
    }))
}
