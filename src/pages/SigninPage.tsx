import { useState } from 'react';
import { useNavigate } from 'react-router';
import useForm from '../hooks/useform';
import { useAuth } from '../context/AuthContext';
import { validateSignIn, type UserSignInformation } from '../utils/validate';

const LOGIN_ERRORS: Record<string, string> = {
  INVALID_CREDENTIALS: '이메일 또는 비밀번호가 올바르지 않습니다.',
  TOKEN_INVALID: '유효하지 않은 토큰입니다. 다시 로그인해주세요.',
  APPROVAL_PENDING: '관리자 승인 대기 중인 계정입니다.',
  APPROVAL_REJECTED: '관리자에 의해 승인이 거절된 계정입니다.',
  ADMIN_REQUIRED: '관리자 권한이 필요합니다.',
  USER_NOT_FOUND: '사용자를 찾을 수 없습니다.',
};

const SigninPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const { values, errors, touched, getInputProps } = useForm<UserSignInformation>({
    initialValues: { email: '', password: '' },
    validate: validateSignIn,
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setServerError('');
    setIsLoading(true);
    try {
      await login(values);
    } catch (error: any) {
      console.error('[로그인 에러]', error);
      const code = error?.response?.data?.error?.code;
      console.log('[에러 코드]', code, '| 상태코드:', error?.response?.status);
      setServerError(LOGIN_ERRORS[code] ?? '로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const isdisabled =
    isLoading ||
    Object.values(errors || {}).some(error => error.length > 0) ||
    Object.values(values).some(value => value === '');

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="flex flex-col gap-3">
        <input
          {...getInputProps('email')}
          name="email"
          className={`border w-75 rounded py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 ${errors?.email && touched?.email ? "border-red-500 bg-red-100" : "border-gray-300"}`}
          type="email"
          placeholder="이메일"
        />
        {errors?.email && touched?.email && (
          <div className="text-red-500 text-sm">{errors.email}</div>
        )}
        <input
          {...getInputProps('password')}
          name="password"
          className={`border w-75 rounded py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 ${errors?.password && touched?.password ? "border-red-500 bg-red-100" : "border-gray-300"}`}
          type="password"
          placeholder="비밀번호"
        />
        {serverError && (
          <div className="bg-red-50 border border-red-400 text-red-700 text-sm px-3 py-2 rounded">
            {serverError}
          </div>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isdisabled}
          className="bg-blue-500 cursor-pointer disabled:bg-gray-400 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {isLoading ? '로그인 중...' : '로그인'}
        </button>
        <button
          type="button"
          onClick={() => navigate("/signup")}
          className="bg-blue-500 cursor-pointer disabled:bg-gray-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          회원가입
        </button>
      </div>
    </div>
  );
};

export default SigninPage;
