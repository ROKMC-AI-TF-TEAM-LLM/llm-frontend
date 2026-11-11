import type { ComponentProps } from 'react'
import { Reveal as BaseReveal } from '../Reveal'

/** 이용 안내 화면의 등장 효과(더 멀리서, 흐릿하게 시작) */
export function Reveal(
  props: Omit<ComponentProps<typeof BaseReveal>, 'variant'>,
) {
  return <BaseReveal variant="deep" {...props} />
}
