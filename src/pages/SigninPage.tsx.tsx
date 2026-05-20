// import { useState } from 'react';
// import axios from 'axios';
import useForm from '../hooks/useForm.ts';
import { validateSignIn, type UserSignInformation } from '../utils/validate';
import { login } from '../api/services/auth';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { LOCAL_STORAGE_KEY } from '../constants/key.ts';

const SigninPage = () => {
  const { setItem } = useLocalStorage(LOCAL_STORAGE_KEY.ACCESS_TOKEN);
  const { values, errors, touched, getInputProps } = useForm<UserSignInformation>({
    initialValues: {
      email: '',
      password: ''
    },
    validate: validateSignIn,
  });

  const handleSubmit = async () => {
    console.log(values);
    try {
      const response = await login(values);
      setItem(response.data.access_token);
    } catch (error) {
      console.error(error);
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
          className={`border border-[accc] w-75 rounded py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 ${errors?.email && touched?.email ? "border-red-500 bg-red-100" : "border-gray-300"}`}
          type="email"
          placeholder="이메일"
        />
        {errors?.email && touched?.email && (
          <div className="text-red-500 text-sm">{errors.email}</div>
        )}
        <input
          {...getInputProps('password')}
          name="password"
          className={`border border-[accc] w-75 rounded py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 ${errors?.password && touched?.password ? "border-red-500 bg-red-100" : "border-gray-300"}`}
          type="password"
          placeholder="비밀번호"
        />

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