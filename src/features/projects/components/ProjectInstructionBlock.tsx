import { useState } from 'react'
import IconButton from '@/shared/components/IconButton'
import { PlusIcon } from '@/shared/components/icons'
import { Block } from './Block'
import { InstructionBody } from './InstructionBody'
import { InstructionModal } from './InstructionModal'
import { SparkIcon } from './icons'

/** 프로젝트 화면 왼쪽 패널의 지침 영역과 편집 모달 */
export function ProjectInstructionBlock({
  instructions,
  onSave,
}: {
  instructions: string
  onSave: (instructions: string) => void
}) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <Block
        icon={<SparkIcon className="h-4 w-4" />}
        title="지침"
        action={
          <IconButton label="지침 편집" onClick={() => setModalOpen(true)}>
            <PlusIcon className="h-4 w-4" strokeWidth={2.2} />
          </IconButton>
        }
      >
        <InstructionBody
          text={instructions}
          onEdit={() => setModalOpen(true)}
          clamp={6}
        />
      </Block>
      <InstructionModal
        open={modalOpen}
        initial={instructions}
        onClose={() => setModalOpen(false)}
        onSave={onSave}
      />
    </>
  )
}
