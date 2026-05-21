export type UserSignInformation = {
  email: string;
  password: string;
};

function validateUser(values: UserSignInformation) {
  const errors = {
    email: '',
    password: ''
  };

  if (values.email && !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/i.test(values.email)) {
    errors.email = '이메일 형식이 올바르지 않습니다.';
  }

    if (!(values.password.length >= 0 && values.password.length <= 20)) {
      errors.password = '';
   }

   return errors;
}

  function validateSignIn(values: UserSignInformation) {
    return validateUser(values);
    };

export { validateSignIn };