import { useState } from 'react';

const SignupPage = () => {
  const handleSubmit = () => {};
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="flex flex-col gap-3">
        <input
          className={'border border-[accc] w-75 rounded py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 '}
          type={"email"}
          placeholder={'이메일'}
            />    
        <div className='text-red-500 text-sm'>이메일 에러</div>
        <input
          className={'border border-[accc] w-75 rounded py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 '}
          type={"password"}
          placeholder={'비밀번호'}
            />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={false}
            className="bg-blue-500 cursor-pointer disabled:bg-gray-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
          로그인
      </button>
      </div>
    </div>
  );
};
export default SignupPage;