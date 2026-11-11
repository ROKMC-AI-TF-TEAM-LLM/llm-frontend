import { type Message } from '../types';
import { queryClient } from '@/lib/queryClient';

// 세션 목록은 전역(['sessions'])과 프로젝트별(['projects','sessions',id]) 두 캐시에 있다.
// 세션이 바뀌면 둘 다 갱신해야 프로젝트 패널이 사이드바와 어긋나지 않는다.
export const invalidateSessionLists = () => {
  queryClient.invalidateQueries({ queryKey: ['sessions'] });
  queryClient.invalidateQueries({ queryKey: ['projects', 'sessions'] });
};

export const streamRegistry = new Map<string, Message[]>();

// 스트림 중단 핸들은 세션별로 둔다. 스토어의 abortController는 '지금 보고 있는 세션'의 것만 가리켜야
// 다른 대화를 다녀온 뒤에도 중지 버튼이 올바른 스트림을 멈춘다.
export const streamControllers = new Map<string, AbortController>();

export const releaseController = (sessionId: string, controller: AbortController) => {
  if (streamControllers.get(sessionId) === controller) streamControllers.delete(sessionId);
};
