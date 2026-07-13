import React from 'react';
import { StandardEditorProps } from '@grafana/data';
import { MultiSelect, SelectableValue } from '@grafana/ui';

interface Settings {}

export const FieldNamesMultiSelectEditor: React.FC<StandardEditorProps<string[], Settings>> = ({
  value,
  onChange,
  context,
}) => {
  // Extrae de forma dinámica todos los nombres de columnas únicos del data frame actual
  const options = React.useMemo<Array<SelectableValue<string>>>(() => {
    if (!context || !context.data) {
      return [];
    }
    const fields = new Set<string>();
    context.data.forEach((frame) => {
      if (frame && frame.fields) {
        frame.fields.forEach((field) => {
          if (field && field.name) {
            fields.add(field.name);
          }
        });
      }
    });
    return Array.from(fields).map((name) => ({
      label: name,
      value: name,
    }));
  }, [context]);

  // Convierte el valor actual en el formato que requiere el componente MultiSelect
  const selectValue = React.useMemo(() => {
    return (value || []).map((val) => ({
      label: val,
      value: val,
    }));
  }, [value]);

  return (
    <MultiSelect
      options={options}
      value={selectValue}
      onChange={(selected) => {
        onChange(selected.map((opt) => opt.value!));
      }}
      placeholder="Selecciona columnas de agrupación..."
    />
  );
};
