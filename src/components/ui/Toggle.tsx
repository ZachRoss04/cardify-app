import React from 'react';

interface ToggleOption {
  value: string;
  label: string;
}

interface ToggleProps {
  options: ToggleOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

const Toggle: React.FC<ToggleProps> = ({
  options,
  value,
  onChange,
  label,
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="flex bg-gray-100 rounded-lg p-1">
        {options.map((option) => (
          <button
            key={option.value}
            className={`flex-1 text-sm py-2 px-3 rounded-md transition-all duration-200 ${
              value === option.value
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Toggle;