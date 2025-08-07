import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { productTypeApi } from '../api/endpoints';


interface DynamicAttributeFieldsProps {
  productTypeId: number;
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;

  errors?: Record<string, any>;
  existingValues?: Record<number, string>;
}

export const DynamicAttributeFields: React.FC<DynamicAttributeFieldsProps> = ({
  productTypeId,
  register,
  setValue,

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
    if (attributes?.items && existingValues) {
      attributes.items.forEach(attr => {
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

  if (!attributes?.items || attributes.items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-900">Product Attributes</h4>
      
      {attributes.items.map((attribute) => (
        <div key={attribute.id}>
          <label className="label">
            {attribute.name}
          </label>
          
          <input
            {...register(`attributes.${attribute.id}`)}
            type="text"
            className="input"
            placeholder={`Enter ${attribute.name.toLowerCase()}`}
          />
          
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