import { useEffect, useState } from "react";

interface UseFormProps<T> {
  initialValues: T;
  validate: (values: T) => Record<keyof T, string>;
}

function useForm<T>({ initialValues, validate }: UseFormProps<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [touched, setTouched] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>);
  const [errors, setErrors] = useState<Record<keyof T, string>>({} as Record<keyof T, string>);

  const handleChange = (name: keyof T, text: string) => {
    setValues({ ...values, [name]: text });
  };

  const handleBlur = (name: keyof T) => {
    setTouched({ ...touched, [name]: true });
  };

  const getInputProps = (name: keyof T) => {
    const value = values[name] ?? '';
    const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
      handleChange(name, e.target.value);
    const onBlur = () => handleBlur(name);
    return { value, onChange, onBlur };
  };

  const reset = () => {
    setValues(initialValues);
    setTouched({} as Record<keyof T, boolean>);
    setErrors({} as Record<keyof T, string>);
  };

  useEffect(() => {
    const userErrors = validate(values);
    setErrors(userErrors);
  }, [values, validate]);

  return { values, errors, touched, getInputProps, reset };
}

export default useForm;