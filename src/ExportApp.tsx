import "ka-table/style.css";
import './App.css';
import axios from 'axios';

import React, { useState } from 'react';

import { ITableProps, kaReducer, Table } from 'ka-table';
import {
  deselectAllFilteredRows, deselectRow, loadData, selectAllFilteredRows, selectRow, selectRowsRange, updateData,
} from 'ka-table/actionCreators';
import { ActionType, DataType, FilteringMode, SortingMode } from 'ka-table/enums';
import { ICellTextProps, IHeadCellProps } from 'ka-table/props';
import { DispatchFunc } from 'ka-table/types';
import { kaPropsUtils } from 'ka-table/utils';


class BasicEntity {
  index: number;
  objectId: String;
  title: String;
  tags: String;
  entityType: String;

  constructor(index: number, id: String, title: String, tags: String[], entityType: String) {
    this.index = index;
    this.objectId = id;
    this.title = title;
    this.tags = tags.join(", ");
    this.entityType = entityType;
  }
}

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
          dispatch(selectAllFilteredRows()); // also available: selectAllFilteredRows(), selectAllVisibleRows(), selectAllRows()
        } else {
          dispatch(deselectAllFilteredRows()); // also available: deselectAllFilteredRows(), deselectAllVisibleRows(), deselectAllRows()
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
    { key: 'tags', title: 'Теги', dataType: DataType.String },
    { key: 'entityType', title: 'Тип', dataType: DataType.String },
  ],
  paging: {
    enabled: true,
    // enabled: false,
  },
  // data: entities["Forms"],
  // rowKeyField: 'objectId',
  rowKeyField: 'index',
  // selectedRows: [3, 5],
  sortingMode: SortingMode.Single,
  filteringMode: FilteringMode.FilterRow,
  singleAction: loadData(),
};

const ExportApp: React.FC = () => {

  const [tableProps, changeTableProps] = useState(tablePropsInit);
  const [link, changeLink] = useState<String>("");
  const [linkVisible, changeLinkVisible] = useState(false);

  const dispatch: DispatchFunc = async action => {

    changeTableProps((prevState: ITableProps) => kaReducer(prevState, action));

    if (action.type === ActionType.LoadData) {
      var data: BasicEntity[] = [];
      try {
        
        const response = await fetch('http://localhost:8080/export/entities');
        const result = await response.json();
        var index = 0;
        for (var entityType in result) {
          result[entityType].forEach((e: any) => {
            const objId: String = e.objectId;
            const title: String = e.title;
            const tags: String[] = e?.tags === undefined || e?.tags === null ? [] : e.tags;
            const basic: BasicEntity = new BasicEntity(index, objId, title, tags, entityType);
            data.push(basic);
            index += 1;
          });
        }
        
      }
      catch (err) {
        console.log(err);
      }
      finally {
        dispatch(updateData(data));
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
        onClick={async () => {
          if (tableProps.selectedRows == undefined || tableProps.selectedRows.length == 0) return;
          const data: BasicEntity[] = [];
          tableProps.selectedRows?.forEach(i => {
            data.push(tableProps.data?.at(i));
          });
          var requestBody = {
            transactionId: "",
            workflows:    data?.filter((x: BasicEntity) => x.entityType === "Workflow"    ).map((be) => be.objectId),
            dictionaries: data?.filter((x: BasicEntity) => x.entityType === "Dictionaries").map((be) => be.objectId),
            templates:    data?.filter((x: BasicEntity) => x.entityType === "Templates"   ).map((be) => be.objectId),
            interfaces:   data?.filter((x: BasicEntity) => x.entityType === "Interfaces"  ).map((be) => be.objectId),
            pages:        data?.filter((x: BasicEntity) => x.entityType === "Pages"       ).map((be) => be.objectId),
            groups:       data?.filter((x: BasicEntity) => x.entityType === "Groups"      ).map((be) => be.objectId),
            jobs:         data?.filter((x: BasicEntity) => x.entityType === "Jobs"        ).map((be) => be.objectId),
            forms:        data?.filter((x: BasicEntity) => x.entityType === "Forms"       ).map((be) => be.objectId),
          }

          const response1 = await fetch('http://localhost:8080/export/withprogress', {
            method: "POST",
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody),
          });
          
          var exportId = (await response1.json()).exportId;
          var url = "http://localhost:8080/export/get/" + exportId;
          console.log(url);
          changeLink(url);
          setTimeout(() => changeLinkVisible(true), 10000);

          // onClick end //
        }}
      >Экспортировать</button>

      {link != "" &&
        <div className="full-screen-panel">
          {linkVisible &&
            <a
            href={link as string}
            onClick={() => { changeLink(""); changeLinkVisible(false); }}
            className={"download-link"}
          >Скачать</a>
          }
          { !linkVisible && <span>Идет формирование файла...</span> }
        </div>
      }
    </div>

  );
};

export default ExportApp;