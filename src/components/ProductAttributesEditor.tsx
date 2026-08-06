import { Plus, Trash2 } from 'lucide-react';
import AttributeTypeSelector from './AttributeTypeSelector';
import type { ProductAttributeInput } from '../types/api';

export interface ProductAttributeFormRow {
  key: string;
  attribute_type_id: number;
  attribute_type_name: string;
  value: string;
}

interface ProductAttributesEditorProps {
  value: ProductAttributeFormRow[];
  onChange: (rows: ProductAttributeFormRow[]) => void;
}

export function toProductAttributesPayload(
  rows: ProductAttributeFormRow[]
): ProductAttributeInput[] {
  return rows
    .filter((row) => row.attribute_type_id > 0 && row.value.trim().length > 0)
    .map((row) => ({
      attribute_type_id: row.attribute_type_id,
      value: row.value.trim(),
    }));
}

export function createEmptyAttributeRow(): ProductAttributeFormRow {
  return {
    key: crypto.randomUUID(),
    attribute_type_id: 0,
    attribute_type_name: '',
    value: '',
  };
}

export default function ProductAttributesEditor({ value, onChange }: ProductAttributesEditorProps) {
  const addRow = () => {
    onChange([...value, createEmptyAttributeRow()]);
  };

  const removeRow = (key: string) => {
    onChange(value.filter((row) => row.key !== key));
  };

  const updateRow = (key: string, patch: Partial<ProductAttributeFormRow>) => {
    onChange(value.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Atributos</h3>
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
        >
          <Plus className="h-4 w-4 mr-1" />
          Agregar atributo
        </button>
      </div>

      {value.length === 0 ? (
        <p className="text-sm text-gray-500">
          Podés agregar atributos opcionales (color, tamaño, etc.) al producto.
        </p>
      ) : (
        <div className="space-y-3">
          {value.map((row) => {
            const excludeIds = value
              .filter((other) => other.key !== row.key && other.attribute_type_id > 0)
              .map((other) => other.attribute_type_id);

            return (
              <div
                key={row.key}
                className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 items-end border border-gray-200 rounded-lg p-4"
              >
                <div>
                  <label className="label">Tipo de atributo</label>
                  <AttributeTypeSelector
                    value={row.attribute_type_id || undefined}
                    selectedName={row.attribute_type_name}
                    excludeIds={excludeIds}
                    onChange={(attributeTypeId, attributeType) =>
                      updateRow(row.key, {
                        attribute_type_id: attributeTypeId,
                        attribute_type_name: attributeType?.name ?? '',
                      })
                    }
                  />
                </div>
                <div>
                  <label className="label">Valor</label>
                  <input
                    type="text"
                    className="input text-base"
                    placeholder="Ej.: Rojo, 15 cm…"
                    value={row.value}
                    onChange={(e) => updateRow(row.key, { value: e.target.value })}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeRow(row.key)}
                  className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
                  title="Quitar atributo"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
