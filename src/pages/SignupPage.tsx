import { useState } from 'react';
import { z } from 'zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { signup } from '../api/services/auth';

const schema = z.object({
  email: z.string().email('유효한 이메일 주소를 입력해주세요.'),
  // 비밀번호 유효성 검사 추후 정의
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
  passwordCheck: z.string(),
  name: z.string().min(1, '이름을 입력해주세요.')
})
.refine((data) => data.password === data.passwordCheck, {
  message: '비밀번호가 일치하지 않습니다.',
  path: ['passwordCheck']
});

type FormFields = z.infer<typeof schema>;

const SignupPage = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormFields>({
    defaultValues: { name: '', email: '', password: '', passwordCheck: '' },
    resolver: zodResolver(schema),
    mode: "onBlur"
  });

const SIGNUP_ERRORS: Record<string, string> = {
  EMAIL_ALREADY_EXISTS: '이미 사용 중인 이메일입니다.',
};

  const onSubmit: SubmitHandler<FormFields> = async (data) => {
    const { passwordCheck: _, ...rest } = data;
    try {
      await signup(rest);
      navigate('/signin');
    } catch (error: any) {
      const code = error?.response?.data?.error?.code;
      setServerError(SIGNUP_ERRORS[code] ?? '회원가입 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
        <input
          {...register('email')}
          className={`border w-75 rounded py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500
            ${errors?.email ? "border-red-500 bg-red-100" : "border-gray-300"}`}
          type="email"
          placeholder="이메일"
        />
        {errors?.email && <div className="text-red-500 text-sm">{errors.email.message}</div>}

        <input
          {...register('password')}
          className={`border w-75 rounded py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500
            ${errors?.password ? "border-red-500 bg-red-100" : "border-gray-300"}`}
          type="password"
          placeholder="비밀번호"
        />
        {errors?.password && <div className="text-red-500 text-sm">{errors.password.message}</div>}

        <input
          {...register('passwordCheck')}
          className={`border w-75 rounded py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500
            ${errors?.passwordCheck ? "border-red-500 bg-red-100" : "border-gray-300"}`}
          type="password"
          placeholder="비밀번호 확인"
        />
        {errors?.passwordCheck && <div className="text-red-500 text-sm">{errors.passwordCheck.message}</div>}

        <input
          {...register('name')}
          className={`border w-75 rounded py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500
            ${errors?.name ? "border-red-500 bg-red-100" : "border-gray-300"}`}
          type="text"
          placeholder="이름"
        />
        {errors?.name && <div className="text-red-500 text-sm">{errors.name.message}</div>}

        {serverError && <div className="text-red-500 text-sm font-medium">{serverError}</div>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-500 cursor-pointer disabled:bg-gray-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          {isSubmitting ? '처리 중...' : '회원가입'}
        </button>
      </form>
    </div>
  );
};

export default SignupPage;