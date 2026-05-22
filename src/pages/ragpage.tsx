import { useState } from 'react'
import RagSearchInput from '../ui/components/rag/RagSearchInput'
import RagCard from '../ui/components/rag/RagCard'
import type { RagDocument } from '../types'

const mockDocuments: RagDocument[] = [
  {
    id: '1',
    title: '대한민국헌법',
    fileType: 'PDF',
    preview:
      '유구한 역사와 전통에 빛나는 우리 대한국민은 3ㆍ1운동으로 건립된 대한민국임시정부의 법통과 불의에 항거한 4ㆍ19민주이념을 계승하고, 조국의 민주개혁과 평화적 통일의 사명에 입각하여 정의ㆍ인도와 동포애로써 민족의 단결을 공고히 하고, 모든 사회적 폐습과 불의를 타파하며...',
  },
  {
    id: '2',
    title: '형법',
    fileType: 'HWP',
    preview:
      '형법(刑法, criminal law)이란 범죄와 형벌에 관한 법률 체계로서, 구성요건 충족성, 책임능력, 위법성에 대한 규정과 그에 입각하여 각 죄목의 정의와 처벌의 수위 및 방법론을 다루는 법을 말한다...',
  },
  {
    id: '3',
    title: '민법',
    fileType: 'HWP',
    preview:
      '대한민국의 민법. 즉, 대등한 사인 상호간의 법률관계(재산관계와 가족관계)를 규율하는 법률이다. 현행 대한민국 민법은 총 5개편 1118조로 구성되어 있다...',
  },
  {
    id: '4',
    title: '상법',
    fileType: 'PDF',
    preview:
      '그 연원은 중세시대의 길드 소속 상인들간에 사용된 법률이다. 당시의 상법은 일종의 신분법으로, 상인은 길드에 가입한 소수 인원만을 의미했다. 상인들에게만 적용되는 신분법이었던 상법은 독자적인 재판권을 가지기도 했다. 즉, 상인이 아닌 일반인은 Civil Law 에 의해 일반 민사 법원의 재판을 받지만, 상인 신분을 가진 자들은 중재원이라는 독자적인 재판 기관을 통해 분쟁을 해결했다. 이러한 제도는 현재도 중재라는 시스템으로 잔존하고 있다...',
  },
  {
    id: '5',
    title: '공군법령',
    fileType: 'HWP',
    preview:
      '복무규정에대한내용복무규정에대한내용복무규정에대한내용복무규정에대한내용복무규정에대한내용복무규정에대한내용복무규정에대한내용복무규정에대한',
  },
]

const RagPage = () => {
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filtered = mockDocuments.filter((doc) =>
    doc.title.includes(query) || doc.preview.includes(query)
  )

  return (
    <div className="min-h-full w-full" onClick={() => setSelectedId(null)}>
      <div className="max-w-2xl mx-auto px-8 py-12">
        <h1 className="text-2xl font-semibold text-text-primary mb-5">RAG 목록</h1>
        <RagSearchInput value={query} onChange={setQuery} />
        <div className="grid grid-cols-2 gap-5 mt-7">
          {filtered.map((doc) => (
            <RagCard
              key={doc.id}
              title={doc.title}
              fileType={doc.fileType}
              preview={doc.preview}
              selected={selectedId === doc.id}
              onClick={() => setSelectedId(doc.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default RagPage