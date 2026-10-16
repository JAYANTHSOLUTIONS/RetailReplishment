// src/components/ui/Input.jsx
// Accessible text / number input with label and error state.

import React from 'react';

export default function Input({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error,
  ...rest
}) {
  return (
    <div className="ui-input-wrapper">
      {label && <label htmlFor={id} className="ui-input__label">{label}</label>}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        className={`ui-input ${error ? 'ui-input--error' : ''}`}
        aria-describedby={error ? `${id}-error` : undefined}
        {...rest}
      />
      {error && <span id={`${id}-error`} className="ui-input__error" role="alert">{error}</span>}
    </div>
  );
}
