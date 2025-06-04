import React from 'react';

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  showValue?: boolean;
  valuePrefix?: string;
  valueSuffix?: string;
}

const Slider: React.FC<SliderProps> = ({
  label,
  min,
  max,
  value,
  onChange,
  showValue = true,
  valuePrefix = '',
  valueSuffix = '',
  className = '',
  ...props
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseInt(e.target.value, 10));
  };

  // Calculate percentage for the background gradient
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-2">
        {label && (
          <label className="text-sm font-medium text-gray-700">{label}</label>
        )}
        {showValue && (
          <span className="text-sm text-gray-600">
            {valuePrefix}
            {value}
            {valueSuffix}
          </span>
        )}
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={handleChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer 
                     accent-blue-600
                     focus:outline-none focus:ring-2 focus:ring-blue-300"
          style={{
            background: `linear-gradient(to right, #2563eb 0%, #2563eb ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`,
          }}
          {...props}
        />
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>
    </div>
  );
};

export default Slider;