// src/components/ui/Select.jsx
// Accessible <select> wrapper with label and error state.

import React from 'react';

export default function Select({ id, label, value, onChange, options = [], error, ...rest }) {
  return (
    <div className="ui-select-wrapper">
      {label && <label htmlFor={id} className="ui-select__label">{label}</label>}
      <select
        id={id}
        value={value}
        onChange={onChange}
        className={`ui-select ${error ? 'ui-select--error' : ''}`}
        aria-describedby={error ? `${id}-error` : undefined}
        {...rest}
      >
        {options.map(({ value: v, label: l }) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
      {error && <span id={`${id}-error`} className="ui-select__error" role="alert">{error}</span>}
    </div>
  );
}
