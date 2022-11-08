import React from "react";
import "./App.css"



const handleFile = (fileList: FileList) => {
    console.log(fileList)
}

const ImportApp: React.FC = () => {
    return (
        <div className="import-app">
            <div className="file-input">
                <input
                    type="file"
                    onChange={(e) => handleFile(e.target.files as FileList)}
                />
            </div>
            <div><button className="btn-primary">Импортировать</button></div>
        </div>
    )
};

export default ImportApp;