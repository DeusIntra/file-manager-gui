import React, { useState } from "react";
import "./App.css"
import "ka-table/style.css";
import axios from "axios";
import { ITableProps, kaReducer, Table } from 'ka-table';
import {
    deselectAllFilteredRows, deselectRow, selectAllFilteredRows, selectRow, selectRowsRange, updateData,
} from 'ka-table/actionCreators';
import { DataType, FilteringMode, SortingMode } from 'ka-table/enums';
import { ICellTextProps, IHeadCellProps } from 'ka-table/props';
import { DispatchFunc } from 'ka-table/types';
import { kaPropsUtils } from 'ka-table/utils';

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
        { key: 'objectId', title: 'objectId', dataType: DataType.String },
        { key: 'type', title: 'Тип конфликта', dataType: DataType.String },
        { key: 'rewrite', title: 'Данные', dataType: DataType.String },
    ],
    paging: {
        enabled: true,
    },
    rowKeyField: 'objectId',
    // selectedRows: [3, 5],
    sortingMode: SortingMode.Single,
    filteringMode: FilteringMode.FilterRow,
    // singleAction: loadData(),
};

interface ImportCheckResultData {
    uuid: string;
    conflicts: any;
    dublicates: any;
    translationDublicates: any;
};

interface ImportRewriteData {
    uuid: string;
    rewrite: any;
}

class basicCheck {
    objectId: string;
    type: string;
    rewrite: string;

    constructor(objectId: string, type: string, rewrite: string) {
        this.objectId = objectId;
        this.type = type;
        this.rewrite = rewrite;
    }
}

const convertToArray = (data: ImportCheckResultData) => { // uuid conflicts dublicates
    var result: basicCheck[] = [];

    for (const id of Object.keys(data.conflicts)) {
        const rewriteData = JSON.stringify(data.conflicts[id], undefined, 2)
        result.push(new basicCheck(id, "Conflict", rewriteData));
    }
    for (const id of Object.keys(data.dublicates)) {
        if (data.dublicates[id] === 0) continue;
        result.push(new basicCheck(id, "Dublicate", data.dublicates[id]));
    }

    return result;
}

var checkData: ImportCheckResultData;

// #region ImportApp

const ImportApp: React.FC = () => {

    const [importState, setImportState] = useState<string>('initial');
    const [tableProps, changeTableProps] = useState(tablePropsInit);
    const [result, setResult] = useState("");

    const dispatch: DispatchFunc = (action) => {
        changeTableProps((prevState: ITableProps) => kaReducer(prevState, action));
    };

    var fileList: FileList;
    return (
        <div className="App">

            {importState === 'initial' &&
                <div className="import-app">
                    <div className="file-input">
                        <input
                            type="file"
                            onChange={(e) => fileList = e.target.files as FileList}
                        />
                    </div>
                    <div><button
                        className="btn-primary"
                        onClick={async () => {

                            const file = fileList.item(0);

                            if (file) {
                                const formData = new FormData();
                                formData.append("file", file as Blob);
                                axios.post('http://localhost:8080/import/check', formData)
                                    .then((response) => {
                                        checkData = response.data as ImportCheckResultData;
                                        const result = convertToArray(checkData);
                                        setImportState('check');
                                        dispatch(updateData(result));
                                    })
                                    .catch(() => {
                                        setImportState('upload exception');
                                        setTimeout(() => setImportState('initial'), 5000);
                                    });
                                setImportState('load check');
                            }
                        }}
                    >Проверить конфликты</button></div>
                </div>
            }
            {importState === 'load check' &&
                <div className="full-screen-panel">Загрузка данных</div>
            }
            {importState === 'upload exception' &&
                <div className="full-screen-panel">Ошибка при загрузке данных. Попробуйте позже.</div>
            }
            {importState === 'import exception' &&
                <div className="full-screen-panel">Ошибка при импорте данных. Попробуйте позже.</div>
            }
            {(importState === 'check' || importState === 'wait for result') &&
                <>
                    <div className="selection-demo">
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
                            if (tableProps.selectedRows === undefined || tableProps.selectedRows.length === 0) return;

                            var rewrite: any = {};
                            tableProps.selectedRows?.forEach((objectId) => {
                                if (checkData?.conflicts[objectId])
                                    rewrite[objectId] = checkData.conflicts[objectId];
                                if (checkData?.dublicates[objectId])
                                    rewrite[objectId] = checkData.dublicates[objectId];
                                if (checkData?.translationDublicates[objectId])
                                    rewrite[objectId] = checkData.translationDublicates[objectId];
                            });

                            const importRewriteData: ImportRewriteData = { uuid: checkData.uuid, rewrite: rewrite };

                            axios.post('http://localhost:8080/import', importRewriteData)
                                .then((response) => {
                                    if (response.status === 200) {
                                        setResult(response.data);
                                        if (result === '') {
                                            setImportState('result timeout');
                                            setTimeout(() => setImportState('check'), 5000);
                                        }
                                        else {
                                            setImportState('result');
                                            tableProps.selectedRows = [];
                                            setTimeout(() => setImportState('initial'), 10000)
                                        }
                                    }
                                })
                                .catch(() => {
                                    setImportState('import exception');
                                    setTimeout(() => setImportState('check'), 5000);
                                });

                            setImportState('wait for result');

                            // onClick end //
                        }}
                    >Импортировать</button>
                    {importState === 'wait for result' &&
                        <div className="full-screen-panel">Ожидание результата...</div>
                    }
                </>
            }
            {importState === 'result' &&
                <div className="full-screen-panel">
                    <div className="result" dangerouslySetInnerHTML={{ __html: result }}></div>
                </div>
            }
            {importState === 'result timeout' &&
                <div className="full-screen-panel">Превышено время ожидания результата</div>
            }
        </div>
    )
};

//#endregion

export default ImportApp;