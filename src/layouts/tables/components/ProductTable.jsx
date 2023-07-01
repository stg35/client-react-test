import React, { useState, useRef, useEffect, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import moment from "moment";
import "moment/locale/ru";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import MDButton from "components/MDButton";
import MDInput from "components/MDInput";
import styles from "./ProductTable.module.css";
import cn from "classnames";
import { Select, MenuItem } from "@mui/material";

const ProductTable = () => {
  const gridRef = useRef();
  const [rowData, setRowData] = useState([]);
  const [isAddButToggled, setIsAddButToggled] = useState(false);
  const [inputs, setInputs] = useState({});
  const [categories, setCategories] = useState();
  const [selectedRow, setSelectedRow] = useState();
  const [columnDefs, setColumnDefs] = useState([
    { field: "Название", editable: true },
    { field: "Описание", editable: true },
    { field: "Цена" },
    { field: "Категория" },
    { field: "Дата добавления" },
  ]);

  const cellClickedListener = useCallback((event) => {
    setSelectedRow(event);
  }, []);

  useEffect(() => {
    fetch("http://localhost:8000/api/products")
      .then((result) => result.json())
      .then((rowData) => {
        const data = rowData.map((item) => {
          return {
            id: item.id,
            category_id: item.category.category_id,
            Название: item.product_name,
            Описание: item.description,
            Цена: item.price,
            Категория: item.category.category_name,
            "Дата добавления": moment(item.createdAt).locale("ru").fromNow(),
          };
        });
        setRowData(data);
        console.log(data);
      })
      .catch((e) => console.log(e));
  }, []);

  useEffect(() => {
    fetch("http://localhost:8000/api/categories")
      .then((result) => result.json())
      .then((categories) => {
        setCategories(categories);
      })
      .catch((e) => console.log(e));
  }, []);

  const addButtonListener = useCallback(() => {
    if (isAddButToggled) {
      setIsAddButToggled(false);
      return;
    }
    setIsAddButToggled(true);
  }, [isAddButToggled]);

  const changeButtonListener = useCallback(async () => {
    if (selectedRow) {
      gridRef.current.api.startEditingCell({
        rowIndex: selectedRow.rowIndex,
        colKey: "Название",
      });
      gridRef.current.api.startEditingCell({
        rowIndex: selectedRow.rowIndex,
        colKey: "Описание",
      });
      gridRef.current.api.startEditingCell({
        rowIndex: selectedRow.rowIndex,
        colKey: "Цена",
      });
      gridRef.current.api.startEditingCell({
        rowIndex: selectedRow.rowIndex,
        colKey: "Категория",
      });
    } else {
      alert("Выберите строку");
    }
  }, [columnDefs, selectedRow, gridRef]);

  const handleChange = useCallback((event) => {
    const name = event.target.name;
    const value = event.target.value;
    setInputs((values) => ({ ...values, [name]: value }));
  });

  const formSubmitHandler = useCallback(
    async (e) => {
      e.preventDefault();
      if (Object.keys(inputs).length == 4) {
        const data = {
          product_name: inputs.name,
          description: inputs.description,
          price: inputs.price,
          category_id: inputs.category.category_id,
        };
        try {
          const response = await fetch("http://localhost:8000/api/products", {
            method: "POST",
            headers: {
              "Content-Type": "application/json;charset=utf-8",
            },
            body: JSON.stringify(data),
          });
          const result = await response.json();
          if (!result.error) {
            setRowData((oldData) => [
              ...oldData,
              {
                Название: result.product_name,
                Описание: result.description,
                Цена: result.price,
                Категория: result.category_name,
                "Дата добавления": moment(result.createdAt).locale("ru").fromNow(),
              },
            ]);
          } else {
            alert("Неверный формат");
          }
        } catch (err) {
          console.log(err);
        }
        setIsAddButToggled(false);
        console.log(data);
      }
    },
    [inputs]
  );

  const onCellValueChanged = useCallback(async (event) => {
    console.log(event);
    try {
      const data = {
        id: event.data.id,
        product_name: event.data["Название"],
        description: event.data["Описание"],
        price: event.data["Цена"],
        category_id: event.data.category_id,
      };
      console.log(data);
      const response = await fetch("http://localhost:8000/api/products", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json;charset=utf-8",
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      console.log(result);
      if (!result.error) {
        gridRef.current.api.stopEditing();
      }
    } catch (err) {
      gridRef.current.api.stopEditing(true);
      console.log(err);
    }
  }, []);

  const onRemoveSelected = useCallback(() => {
    const selectedData = gridRef.current.api.getSelectedRows();
    console.log(selectedData);
    selectedData.forEach(async (data) => {
      try {
        const response = await fetch("http://localhost:8000/api/products/" + data.id, {
          method: "DELETE",
        });
        const result = await response.json();
        console.log(result);
      } catch (err) {
        console.log(err);
      }
    });
    gridRef.current.api.applyTransaction({ remove: selectedData });
  }, []);

  const onFirstDataRendered = useCallback((params) => {
    params.api.sizeColumnsToFit();
  });

  return (
    <div>
      <h1>Товары </h1>
      <div className={cn(styles.buttons)}>
        <MDButton color="success" onClick={addButtonListener}>
          Добавить запись
        </MDButton>
        <MDButton color="warning" onClick={changeButtonListener}>
          Изменить
        </MDButton>
        <MDButton color="error" onClick={onRemoveSelected}>
          Удалить
        </MDButton>
      </div>

      {isAddButToggled && (
        <form className={cn(styles.inputs)} onSubmit={formSubmitHandler}>
          <div className={cn(styles.input)}>
            <label>Название</label>
            <MDInput name="name" value={inputs.name || ""} onChange={handleChange}></MDInput>
          </div>
          <div className={cn(styles.input)}>
            <label>Описание</label>
            <MDInput
              name="description"
              value={inputs.description || ""}
              onChange={handleChange}
            ></MDInput>
          </div>
          <div className={cn(styles.input)}>
            <label>Цена</label>
            <MDInput name="price" value={inputs.price || ""} onChange={handleChange}></MDInput>
          </div>
          <div className={cn(styles.input)}>
            <label id="category-label">Категория</label>
            <Select
              className={cn(styles.select)}
              labelId="category-label"
              id="category-select"
              name="category"
              value={inputs.category || ""}
              label="Категория"
              onChange={handleChange}
            >
              {categories.map((category) => (
                <MenuItem key={category.category_id} value={category}>
                  {category.category_name}
                </MenuItem>
              ))}
            </Select>
          </div>
          <div className={cn(styles.plusButton)}>
            <MDButton type="submit" color="success">
              +
            </MDButton>
          </div>
        </form>
      )}

      <div className="ag-theme-alpine" style={{ height: 500 }}>
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          animateRows={true}
          rowSelection="multiple"
          onCellClicked={cellClickedListener}
          onCellValueChanged={onCellValueChanged}
          onGridReady={onFirstDataRendered}
        />
      </div>
    </div>
  );
};

export default ProductTable;
