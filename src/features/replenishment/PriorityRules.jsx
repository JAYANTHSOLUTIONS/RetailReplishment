// src/features/replenishment/PriorityRules.jsx
// Displays and allows editing of the priority rules applied to each product.

import React from 'react';

export default function PriorityRules({ rules = [] }) {
  return (
    <section className="priority-rules" aria-label="Priority rules">
      <h2 className="priority-rules__title">Priority Rules</h2>
      <ol className="priority-rules__list">
        {rules.map((rule) => (
          <li key={rule.id} className="priority-rules__item">
            <strong>{rule.label}</strong>: {rule.description}
          </li>
        ))}
      </ol>
    </section>
  );
}
