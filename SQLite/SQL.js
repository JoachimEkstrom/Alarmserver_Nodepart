//const sqlite3 = require('sqlite3').verbose();
import sqlite3 from 'sqlite3';
//const Excel = require('exceljs')
import Excel from 'exceljs'
//const fs = require("fs")
import * as fs from 'fs'
//const libre = require('libreoffice-convert');
import * as libre from 'libreoffice-convert'
//const path = require('path');
import path from 'path'

export async function callDb(fromDate){
    return new Promise ((resolve, reject)=> {
    let db = new sqlite3.Database('C:\\TwinCAT\\3.1\\Boot\\LoggedEvents.db');
    db.on('error', err => { 
        console.log(err)
    })  
    let sql = `SELECT Entities.Id AS EntityId,
            	EventId, 
            	EventClass,
            	Severity, 
                AlarmState.IsActive AS IsActive, 
                AlarmState.IsRaised AS IsRaised, 
                AlarmState.ConfirmationState AS ConfirmationState, 
                MIN(CASE WHEN Events.CategoryId IN(1, 2) THEN Events.Time END) AS TimeRaised, 
                MAX(CASE WHEN Events.CategoryId = 5 AND AlarmState.ConfirmationState IN(3, 4) THEN Events.Time END) AS TimeConfrimed,
                MAX(CASE WHEN Events.CategoryId IN(3, 4) AND AlarmState.IsRaised = 0 THEN Events.Time END) AS TimeCleared, 
                (SELECT Text FROM Translations WHERE Translations.Id = (SELECT TranslationId FROM StringLocalized_Translations WHERE StringLocalized_Translations.StringLocalizedId = (SELECT StringLocalizedId FROM EventTexts WHERE Entities.EventClass = EventTexts.EventClass AND Entities.EventId = EventTexts.EventId))) AS AlarmDisplayText
            FROM Entities LEFT JOIN Events ON Events.EntityId = Entities.Id LEFT JOIN AlarmState ON AlarmState.EntityId = Entities.Id GROUP BY Entities.Id ORDER BY Entities.Id DESC`;

        // first row only
        db.all(sql, [], (err, row) => {
            if (err) {
                reject(err.message)
            } else {
                let workbook = new Excel.Workbook() 
                workbook.xlsx.readFile("./WindWings_Report_Template.xlsx").then(()=>{
                    let worksheet = workbook.getWorksheet(1);
                    let getRowInsert
                    let fileTime = UTCToFileTime(fromDate)

                    for(let i =0; i<row.length; i++){
                        if (fileTime < row[i].TimeRaised) {

                            getRowInsert = worksheet.getRow(7+i);
                            getRowInsert.getCell('A').value = row[i].EntityId
                            getRowInsert.getCell('B').value = row[i].EventId
                            getRowInsert.getCell('C').value = row[i].AlarmDisplayText
                            getRowInsert.getCell('D').value = severity(row[i].Severity)
                            getRowInsert.getCell('E').value = ConfirmationState(row[i].ConfirmationState)
                            getRowInsert.getCell('F').value = fileTimeToDate(row[i].TimeRaised)
                            getRowInsert.getCell('G').value = fileTimeToDate(row[i].TimeConfrimed)
                            getRowInsert.getCell('H').value = fileTimeToDate(row[i].TimeCleared)
                            getRowInsert.getCell('I').value = row[i].EventClass
                            getRowInsert.commit();

                        }
                    }
                    workbook.xlsx.writeFile('./public/WindWings_Report.xlsx').then(()=> {
                        resolve("Done with .xlsx generation!")
                    });                 
                    
                })
            } 
        });
    // close the database connection
    db.close()
    
})
}


export async function toPDF() {
    return new Promise ((resolve, reject)=> {
        const extend = '.pdf'
        const enterPath = path.join('./', './public/WindWings_Report.xlsx');
        const outputPath = path.join('./', `./public/WindWings_Report${extend}`);

        // Read file
        const file = fs.readFileSync(enterPath);
        // Convert it to pdf format with undefined filter (see Libreoffice doc about filter)
        libre.convert(file, extend, undefined, (err, done) => {
            if (err) {
            console.log(`Error converting file: ${err}`);
            reject(`Error converting file: ${err}`)
            }
            
            // Here in done you have pdf file which you can save or transfer in another stream
            fs.writeFileSync(outputPath, done);
            resolve("Done with .pdf generation!")
        });
        
    })
}

// Check type

function severity (i){
    let a
    switch (i) {
        case 0: 
        a = "Verbose"
        break
        case 1: 
        a = "Info"
        break
        case 2: 
        a = "Warning"
        break
        case 3: 
        a = "Error"
        break
        case 4: 
        a = "Critical"
        break
    } 

    return a
}

// Check Confimation state

function ConfirmationState (i){
    let a
    switch (i) {
        case 0: 
        a = "NotSupported"
        break
        case 1: 
        a = "NotRequired"
        break
        case 2: 
        a = "WaitForConfirmation"
        break
        case 3: 
        a = "Confirmed"
        break
        case 4: 
        a = "Reset"
        break
    } 

    return a
}


//############################################

// Convert from FILETIME to UTC time
function fileTimeToDate( fileTime ) { 
    let newDate = new Date ( (fileTime / 10000) - 11644473600000 );
    newDate = newDate.toUTCString()
    return newDate
 };	

 // Convert from UTC time to FILETIME
function UTCToFileTime( time ) { 
    let fileTime = ((time * 10000) + 116444736000000000)
    return fileTime
 };	