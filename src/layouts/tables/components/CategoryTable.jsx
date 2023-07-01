import React, { useCallback, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

const CategoryTable = () => {
  const [gridApi, setGridApi] = useState(null);

  const columns = [
    {
      headerName: "ID",
      field: "category_id",
    },
    { headerName: "Название категории", field: "category_name" },
    { headerName: "Описание", field: "description" },
  ];
  const datasource = {
    getRows(params) {
      console.log(JSON.stringify(params, null, 1));
      const { startRow, endRow } = params;
      let url = `http://localhost:8000/api/categories?`;
      url += `limit=${endRow - startRow}&offset=${startRow}`;
      fetch(url)
        .then((httpResponse) => httpResponse.json())
        .then((response) => {
          params.successCallback(response, 499);
          console.log(response);
        })
        .catch((error) => {
          console.error(error);
          params.failCallback();
        });
    },
  };

  const onGridReady = useCallback((params) => {
    setGridApi(params);
    params.api.sizeColumnsToFit();
    // register datasource with the grid
    params.api.setDatasource(datasource);
  });
  const components = {
    loading: (params) => {
      if (params.value !== undefined) {
        return params.value;
      } else {
        return "<img src='https://www.ag-grid.com/example-assets/loading.gif'/>";
      }
    },
  };
  return (
    <div>
      <h1>Категории</h1>
      <h4>Реализация Infinite scrolling</h4>
      <div className="ag-theme-alpine" style={{ height: 400 }}>
        <AgGridReact
          columnDefs={columns}
          rowModelType="infinite"
          onGridReady={onGridReady}
          components={components}
          cacheBlockSize={5}
        />
      </div>
    </div>
  );
};

export default CategoryTable;
