import { eventHandler } from './browseDBEventHandling.js';
import {config} from './config.js';
import { allPlots } from './overview.js';
import {generatePlots} from '/javascript/scatter_plots.js';

export function dataTable(inputFilePath, excelColumns, tab) {
    //Get data from Excel File:
    let xhr = new XMLHttpRequest();
    xhr.open("GET", inputFilePath, true);
    xhr.responseType = "blob";
    xhr.onload = function (e) {
        let file = this.response;
        let reader = new FileReader();
        //For Browsers other than IE.
        if (reader.readAsBinaryString) {
            reader.onload = function (e) {
                let rawData = ProcessExcel(e.target.result,excelColumns);
                let data = sortTableHeaders(rawData[0]);
                if(tab === 1){
                    createTable(data);
                    preparePlot(data);
                    filterEvents();
                    eventHandler(rawData[1]);
                }else if(tab === 0){
                    // allPlots(rawData);
                }
            };
            reader.readAsBinaryString(file);
        } 
        else {
            //For IE Browser.
            reader.onload = function (e) {
                let data = "";
                let bytes = new Uint8Array(e.target.result);
                for (let i = 0; i < bytes.byteLength; i++) {
                    data += String.fromCharCode(bytes[i]);
                }
                ProcessExcel(data,excelColumns);
            };
            reader.readAsArrayBuffer(file);
        }
    };
    xhr.send();
};

function ProcessExcel(data,excelColumns) {
    //Read the Excel File data. 
    let workbook = XLS.read(data, {
        type: 'binary'
    });
    //Fetch the name of First Sheet.
    let firstSheet = workbook.SheetNames[0];
    let secondSheet = workbook.SheetNames[1];

    //Read all rows from First Sheet into an JSON array.
    let excelFirstSheetObject = XLS.utils.sheet_to_row_object_array(workbook.Sheets[firstSheet]);
    let referenceData = XLS.utils.sheet_to_row_object_array(workbook.Sheets[secondSheet]);
    //Initialise arrays:
    let intObject = [];

    //Remove empty rows from array:
    for (let i = 0; i<excelFirstSheetObject.length; i++){
        if(excelFirstSheetObject[i].length!=0){
            // console.log(excelObject[i]);
            intObject.push(excelFirstSheetObject[i]);
        }
    };
    //Filter JSON object to get only wanted columns:
    let filtered = intObject.map(function(row){
        let newRow = {}
        for (let i = 0; i< excelColumns.length; i++){
            newRow[excelColumns[i]]= row[excelColumns[i]];
        }
        return newRow;
    });
    const returnData = [filtered, referenceData];
    return returnData;
};

function createTable(data){
    let table = new Tabulator('#data-table3',{
        data:data,
        autoColumnsDefinitions:config.tableColumns,
        autoColumns:true,
        pagination:"remote",
        height:"85vh"    
        // layout:"fitColumns",
        // paginationSize:20,
    });
    table.on("tableBuilt", createSliders(data));
}

export function createSliders(data){
    //Create noUiSliders:

    //Size slider:
    let sizeData = data.map(item => item['H [mm]']);
    let minSize = Math.min.apply(null, sizeData),
        maxSize = Math.max.apply(null, sizeData);
    let sizeSlider = document.getElementById('size-slider');
    noUiSlider.create(sizeSlider, {
        range: {
            'min':minSize, 
            'max': maxSize, 
        },
        step: 50,
        start: [minSize,maxSize],
        tooltips:[true,true],
        connect:true,
        format:{
            to: (v) => parseFloat(v).toFixed(0),
            from: (v) => parseFloat(v).toFixed(0)
        }
    });

    //Shear Span slider:
    let minShear = Math.min.apply(null, data.map(item => item['H0/H'])),
        maxShear = Math.max.apply(null, data.map(item => item['H0/H']));
    let shearStep = 0.1;
    let shearSlider = document.getElementById('shear-slider');
    noUiSlider.create(shearSlider, {
        range: {
            'min':minShear, 
            'max': maxShear, 
        },
        step: shearStep,
        start: [minShear,maxShear],
        tooltips:[true,true],
        connect:true,
    });

    //ALR slider:
    let minALR = Math.min.apply(null, data.filter(item => item['σ0,tot /fc'] != undefined?true:false).map(item => item['σ0,tot /fc'])),
        maxALR = Math.max.apply(null, data.filter(item => item['σ0,tot /fc'] != undefined?true:false).map(item => item['σ0,tot /fc']));
    let ALRStep = 0.05;
    let ALRSlider = document.getElementById('ALR-slider');
    noUiSlider.create(ALRSlider, {
        range: {
            'min':minALR, 
            'max': maxALR, 
        },
        step: ALRStep,
        start: [minALR,maxALR],
        tooltips:[true,true],
        connect:true,
    });
}
//Create a function to get all filters and current values:
function getFilterValues(){
    //1. Checkboxes:
    let checkboxes = document.querySelectorAll("input[type=checkbox][name=check]");
    let sizeSlider = document.getElementById("size-slider");
    let ALRSlider = document.getElementById("ALR-slider");
    let shearSlider = document.getElementById("shear-slider");
    let myFilter = [
        //Size slider:
        {field:'H [mm]',type:'>',value:sizeSlider.noUiSlider.get()[0]},
        {field:'H [mm]',type:'<',value:sizeSlider.noUiSlider.get()[1]},
        //Shear slider:
        {field:'H0/H',type:'>',value:shearSlider.noUiSlider.get()[0]},
        {field:'H0/H',type:'<',value:shearSlider.noUiSlider.get()[1]},
        //ALR slider:
        {field:'σ0,tot /fc',type:'>',value:ALRSlider.noUiSlider.get()[0]},
        {field:'σ0,tot /fc',type:'<',value:ALRSlider.noUiSlider.get()[1]},
        //checkboxes:
        {field:'Typ',type:'in',value:Array.from(checkboxes).filter(i => i.checked).map(i => i.value)}
    ];
    return myFilter;
}

export function filterEvents(){
    //1. Checkboxes:
    let checkboxes = document.querySelectorAll("input[type=checkbox][name=check]");
    checkboxes.forEach(function(checkbox){
        checkbox.addEventListener('change',function(){
            let table = Tabulator.findTable("#data-table3")[0];
            clearBox(document.getElementById('gridplots'));
            //Clear and Apply new filter values to table
            table.clearFilter();
            table.setFilter(getFilterValues());
            //Add first 9 plots to table
            preparePlot(table.getData("active"));
            });
        });
    let sliders = document.querySelectorAll("div[name=slider]");
    sliders.forEach(function(slider){
        let table = Tabulator.findTable("#data-table3")[0];
        //Apply new filter values to table
        slider.noUiSlider.on('slide',function(){
            clearBox(document.getElementById('gridplots'));
            table.clearFilter();
            table.setFilter(getFilterValues());
            preparePlot(table.getData("active"));
        });
    });
}

function preparePlot(data){
    // generatePlots(data.filter(item => item['F-Δ?']=='1'?true:false));
    generatePlots(data);
}

export function clearBox(div) {
    while(div.firstChild) {
        div.removeChild(div.firstChild);
    }
}

function sortTableHeaders(data){
    let shortenedData = data.map(row => config.sortData(row));
    return shortenedData;
}