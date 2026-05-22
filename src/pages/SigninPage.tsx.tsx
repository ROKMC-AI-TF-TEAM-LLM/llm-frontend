//import { useState } from 'react';
//import { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router';
import useForm from '../hooks/useform';
import { useAuth } from '../context/AuthContext';
import { validateSignIn, type UserSignInformation } from '../utils/validate';
// import { useLocalStorage } from '../hooks/useLocalStorage';
// import { LOCAL_STORAGE_KEY } from '../constants/key';
// import { AuthContext } from '../context/AuthContext';

const SigninPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  //const { login } = useContext(AuthContext);
  //const { getItem } = useLocalStorage(LOCAL_STORAGE_KEY.ACCESS_TOKEN);
  //const [serverError, setServerError] = useState<string>('');

  // useEffect(() => {
  //   if (getItem()) navigate('/chat');
  // }, []);

  const { values, errors, touched, getInputProps } = useForm<UserSignInformation>({
    initialValues: { email: '', password: '' },
    validate: validateSignIn,
  });

  const handleSubmit = async () => {
      await login(values);

  //   setServerError('');
  //   try {
  //     await login(values);
  //     //navigate('/chat');
  //   } catch (error) {
  //     setServerError('이메일 또는 비밀번호가 올바르지 않습니다.');
  //   }
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
        {/*{serverError && <div className="text-red-500 text-sm">{serverError}</div>} */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isdisabled}
          className="bg-blue-500 cursor-pointer disabled:bg-gray-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          로그인
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