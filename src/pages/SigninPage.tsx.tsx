import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import useForm from '../hooks/useform';
import { validateSignIn, type UserSignInformation } from '../utils/validate';
import { login } from '../api/services/auth';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { LOCAL_STORAGE_KEY } from '../constants/key';

const SigninPage = () => {
  const navigate = useNavigate();
  const { setItem, getItem } = useLocalStorage(LOCAL_STORAGE_KEY.ACCESS_TOKEN);
  const [serverError, setServerError] = useState<string>('');

  useEffect(() => {
    if (getItem()) navigate('/chat');
  }, []);

  const { values, errors, touched, getInputProps } = useForm<UserSignInformation>({
    initialValues: { email: '', password: '' },
    validate: validateSignIn,
  });

  const handleSubmit = async () => {
    setServerError('');
    try {
      const response = await login(values);
      if (!response.data?.access_token) {
        setServerError('토큰을 받아오지 못했습니다.');
        return;
      }
      setItem(response.data.access_token);
      navigate('/chat');
    } catch (error) {
      setServerError('이메일 또는 비밀번호가 올바르지 않습니다.');
    }
  };

  const isdisabled =
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
        {serverError && <div className="text-red-500 text-sm">{serverError}</div>}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isdisabled}
          className="bg-blue-500 cursor-pointer disabled:bg-gray-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          로그인
        </button>
      </div>
    </div>
  );
};

export default SigninPage;