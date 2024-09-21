import React, { useCallback, useEffect } from "react";

interface TextFilterModel {
  filter: string;
  filterType: "text";
}

interface FilterModel {
  [field: string]: TextFilterModel | null;
}

interface FilterParams {
  colDef: {
    field: string; // pastikan field selalu ada
  };
  api: {
    setFilterModel: (model: FilterModel) => void;
  };
}

interface FloatingFilterProps {
  model: string | null;
  onModelChange: (model: string | null) => void;
  params?: FilterParams; // params bersifat opsional
}

const FloatingFilterCustom: React.FC<FloatingFilterProps> = ({
  model,
  onModelChange,
  params,
}) => {
  useEffect(() => {
    console.log("Floating Filter Created", params);
    return () => console.log("Floating Filter Destroyed");
  }, [params]);

  const valueChanged = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      onModelChange(newValue === "" ? null : newValue);

      if (params && params.colDef) {
        // Memastikan params dan colDef terdefinisi
        const fieldName = params.colDef.field;
        params.api.setFilterModel({
          [fieldName]: newValue
            ? { filter: newValue, filterType: "text" }
            : null,
        });
      }
    },
    [onModelChange, params]
  );

  return (
    <div className="MyFloatingFilter">
      <input
        className="MyFloatingFilterInput"
        type="text"
        value={model || ""}
        onChange={valueChanged}
      />
    </div>
  );
};

export default FloatingFilterCustom;
