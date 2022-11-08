import './App.css';
import "ka-table/style.css";

import React, { useState } from 'react';

import { ITableProps, kaReducer, Table } from 'ka-table';
import {
  deselectAllFilteredRows, deselectRow, loadData, selectAllFilteredRows, selectRow, selectRowsRange, updateData,
} from 'ka-table/actionCreators';
import { ActionType, DataType, FilteringMode, SortingMode } from 'ka-table/enums';
import { ICellTextProps, IHeadCellProps } from 'ka-table/props';
import { DispatchFunc } from 'ka-table/types';
import { kaPropsUtils } from 'ka-table/utils';

// import entities from './json/entities.json';

const SelectionCell: React.FC<ICellTextProps> = ({
  rowKeyValue, dispatch, isSelectedRow, selectedRows
}) => {
  return (
    <input
      type='checkbox'
      checked={isSelectedRow}
      onChange={(event: any) => {
        if (event.nativeEvent.shiftKey) {
          dispatch(selectRowsRange(rowKeyValue, [...selectedRows].pop()));
        } else if (event.currentTarget.checked) {
          dispatch(selectRow(rowKeyValue));
        } else {
          dispatch(deselectRow(rowKeyValue));
        }
      }}
    />
  );
};

const SelectionHeader: React.FC<IHeadCellProps> = ({
  dispatch, areAllRowsSelected,
}) => {
  return (
    <input
      type='checkbox'
      checked={areAllRowsSelected}
      onChange={(event) => {
        if (event.currentTarget.checked) {
          dispatch(selectAllFilteredRows()); // also available: selectAllVisibleRows(), selectAllRows()
        } else {
          dispatch(deselectAllFilteredRows()); // also available: deselectAllVisibleRows(), deselectAllRows()
        }
      }}
    />
  );
};

const tablePropsInit: ITableProps = {
  columns: [
    {
      key: 'selection-cell',
    },
    { key: 'objectId', title: 'ID', dataType: DataType.String },
    { key: 'title', title: 'Название', dataType: DataType.String },
    // { key: 'entityType', title: 'Тип', dataType: DataType.String },
  ],
  paging: {
    enabled: true,
    // enabled: false,
  },
  // data: entities["Forms"],
  rowKeyField: 'objectId',
  // selectedRows: [3, 5],
  sortingMode: SortingMode.Single,
  filteringMode: FilteringMode.FilterRow,
  singleAction: loadData(),
};

const ExportApp: React.FC = () => {
  const [tableProps, changeTableProps] = useState(tablePropsInit);
  const dispatch: DispatchFunc = async action => {
    changeTableProps((prevState: ITableProps) => kaReducer(prevState, action));

    if (action.type === ActionType.LoadData) {
      var data: any = "nothing";
      try {
        const response = await fetch('http://localhost:8080/export/entities');
        data = await response.json();
      }
      catch (err) {
        console.log(err);
      }
      finally
      {
        dispatch(updateData(data.Forms));
      }
    }
  };

  return (
    <div className="App">
      <div className='selection-demo'>
        <Table
          {...tableProps}
          childComponents={{
            cellText: {
              content: (props) => {
                if (props.column.key === 'selection-cell') {
                  return <SelectionCell {...props} />
                }
              }
            },
            filterRowCell: {
              content: (props) => {
                if (props.column.key === 'selection-cell') {
                  return <></>;
                }
              }
            },
            headCell: {
              content: (props) => {
                if (props.column.key === 'selection-cell') {
                  return (
                    <SelectionHeader {...props}
                      areAllRowsSelected={kaPropsUtils.areAllFilteredRowsSelected(tableProps)}
                    // areAllRowsSelected={kaPropsUtils.areAllVisibleRowsSelected(tableProps)}
                    />
                  );
                }
              }
            }
          }}
          dispatch={dispatch}
        />
      </div>

      <button
        className='btn-primary'
        onClick={() => console.log((tableProps.selectedRows))}
      >Экспортировать</button>
    </div>

  );
};

export default ExportApp;