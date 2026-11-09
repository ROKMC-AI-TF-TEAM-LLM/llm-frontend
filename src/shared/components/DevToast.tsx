import { showToast } from '../store/toastStore'

export const showDevToast = (message = '개발 중인 기능입니다.') => showToast(message)
