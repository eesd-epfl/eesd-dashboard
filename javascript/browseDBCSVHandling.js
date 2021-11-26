import {config} from './config.js'

//Take active, filtered data from table and create an array with the name and filepath of each csv file to display 
export function createCSVArray(data){
    let fileNames = [];
    let FDfilePaths = [];

    for (let i = 0; i<data.length; i++){
        let FDFileName = "FD_"+makeFileName(data[i])[0]+".csv";
        let FDFilePath = config.curvesFolderPath + FDFileName;
        FDfilePaths.push(FDFilePath);
        fileNames.push(makeFileName(data[i])[0]);
    }
    const csvData = [FDfilePaths,fileNames];
    return csvData;
}

//Read CSV file and send data to createGraph function:
export function parseData(createGraph,filePath,fileName,fileId){
    Papa.parse(filePath, {
        download: true,
        skipEmptyLines:true,
        header: false,
        complete: function(results){
            createGraph(results.data,fileName,fileId);
        },
        error:function(){
            let errorMessage = fileName.split('_')[0] + "<br>No Data to display";
            let errorDiv = document.createElement("div");
            errorDiv.id = "no-data";
            errorDiv.innerHTML = errorMessage;
            document.getElementById(fileName).append(errorDiv);
        }
    });
}

export function parseEnvelopeData(chart,fileId){

    const filePath = config.envelopesFolderPath + "envelope_"+fileId + ".csv"
    Papa.parse(filePath, {
        download: true,
        skipEmptyLines:true,
        header: false,
        complete: function(result){
            // Format the data from csv file to append to chart:
            const xs = {'envForce':'envDrift'};
            let envDrift = ['envDrift'];
            let envForce = ['envForce'];
            for (let i = 4; i < result.data.length-3; i++){
                if((result.data[i][2]!='NaN' && result.data[i][1]!='NaN') && result.data[i][2]!='[%]'){
                    envDrift.push(result.data[i][2]); //x axis
                    envForce.push(result.data[i][1]); //y axis
                }
            }
            const columns = [envDrift,envForce];
            chart.flow({
                data:{
                    xs:xs, 
                    columns: columns
                }
            })
        },
    });
}

export function makeFileName(data){
    const testUnitName = data['Name'].replaceAll(".","").replaceAll("-","").replaceAll("#","").replaceAll(" ","");
    const reference = data['Reference'].split(' ')[0].normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const year = data['Reference'].split(' ').at(-1).replace("(","").replace(")","");
    const curveName = testUnitName+"_"+reference+year;
    const fileInfo = [curveName, testUnitName];
    return fileInfo;
}