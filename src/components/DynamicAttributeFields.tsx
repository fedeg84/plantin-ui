import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { productTypeApi } from '../api/endpoints';
import { ProductTypeAttribute } from '../types/api';

interface DynamicAttributeFieldsProps {
  productTypeId: number;
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
  errors?: Record<string, any>;
  existingValues?: Record<number, string>;
}

export const DynamicAttributeFields: React.FC<DynamicAttributeFieldsProps> = ({
  productTypeId,
  register,
  setValue,
  watch,
  errors,
  existingValues = {}
}) => {
  const { data: attributes, isLoading } = useQuery({
    queryKey: ['product-type-attributes', productTypeId],
    queryFn: () => productTypeApi.getAttributes(productTypeId),
    enabled: !!productTypeId,
  });

  // Set existing values when attributes load
  React.useEffect(() => {
    if (attributes && existingValues) {
      attributes.forEach(attr => {
        const value = existingValues[attr.id];
        if (value !== undefined) {
          setValue(`attributes.${attr.id}`, value);
        }
      });
    }
  }, [attributes, existingValues, setValue]);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
        <div className="h-10 bg-gray-300 rounded"></div>
      </div>
    );
  }

  if (!attributes || attributes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-900">Product Attributes</h4>
      
      {attributes.map((attribute) => (
        <div key={attribute.id}>
          <label className="label">
            {attribute.name}
            {attribute.is_required && <span className="text-red-500 ml-1">*</span>}
          </label>
          
          {attribute.data_type === 'text' && (
            <input
              {...register(`attributes.${attribute.id}`, {
                required: attribute.is_required ? `${attribute.name} is required` : false
              })}
              type="text"
              className="input"
              placeholder={`Enter ${attribute.name.toLowerCase()}`}
            />
          )}
          
          {attribute.data_type === 'number' && (
            <input
              {...register(`attributes.${attribute.id}`, {
                required: attribute.is_required ? `${attribute.name} is required` : false,
                valueAsNumber: true
              })}
              type="number"
              step="0.01"
              className="input"
              placeholder={`Enter ${attribute.name.toLowerCase()}`}
            />
          )}
          
          {attribute.data_type === 'boolean' && (
            <div className="flex items-center">
              <input
                {...register(`attributes.${attribute.id}`)}
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-900">
                {attribute.name}
              </label>
            </div>
          )}
          
          {attribute.data_type === 'date' && (
            <input
              {...register(`attributes.${attribute.id}`, {
                required: attribute.is_required ? `${attribute.name} is required` : false
              })}
              type="date"
              className="input"
            />
          )}
          
          {errors?.attributes?.[attribute.id] && (
            <p className="mt-1 text-sm text-red-600">
              {errors.attributes[attribute.id].message}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}; 