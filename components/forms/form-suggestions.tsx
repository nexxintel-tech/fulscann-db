import type { SmartFormSuggestion } from "@/lib/forms/suggestions";

export function FormSuggestions({ suggestions }: { suggestions: SmartFormSuggestion[] }) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="suggestions">
      <h3>Suggested next inputs</h3>
      <ul>
        {suggestions.slice(0, 3).map((suggestion) => (
          <li key={suggestion.id} className={`suggestion ${suggestion.priority}`}>
            <strong>{suggestion.title}</strong>
            <span>{suggestion.detail}</span>
            {suggestion.recommendedValue !== undefined ? (
              <code>{suggestion.field ? `${suggestion.field}: ` : ""}{suggestion.recommendedValue}</code>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
