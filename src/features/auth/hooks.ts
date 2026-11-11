import { useMutation } from '@tanstack/react-query'
import { signup } from './api'
import type { SignupRequest } from './types'

/** 회원가입. 실패 기록은 전역 mutationCache가 'mutation:signup'으로 남긴다 */
export const useSignup = () =>
  useMutation({ mutationKey: ['signup'], mutationFn: (data: SignupRequest) => signup(data) })
