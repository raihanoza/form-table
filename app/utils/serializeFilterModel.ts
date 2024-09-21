// Define a type for the filter model
export interface FilterModel {
  [key: string]: string | number | { [key: string]: string | number };
}

export function serializeFilterModel(filterModel: FilterModel): string {
  const queryString = new URLSearchParams();

  Object.entries(filterModel).forEach(([key, value]) => {
    // Handle different types of filter values
    if (typeof value === "object" && value !== null) {
      Object.entries(value).forEach(([subKey, subValue]) => {
        queryString.append(`${key}[${subKey}]`, subValue.toString());
      });
    } else {
      queryString.append(key, value.toString());
    }
  });

  return queryString.toString();
}
