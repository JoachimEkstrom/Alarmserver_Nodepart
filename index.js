const express = require('express')
const Excel = require('exceljs')
const fs = require("fs")
const libre = require('libreoffice-convert');
const path = require('path');
const app = express()
const port = 4000
let cors = require('cors')
app.use(cors())
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use(express.static('public'))
const sqlite3 = require('sqlite3').verbose();


app.get('/xlsx', async (req, res) => {
  
    let dbPromise = callDb()

    dbPromise.then(()=> {
        res.sendFile('./public/WindWings_Report.xlsx', { root: __dirname })
    }).catch(()=>{
        res.send(error)
    })

})

app.get('/pdf', async (req, res) => {

    let dbPromise = callDb()
    dbPromise.then(()=> {

            let pdfPromise = toPDF()
            pdfPromise.then(()=>{
                res.sendFile('./public/WindWings_Report.pdf', { root: __dirname })
            }).catch((message)=>{
                console.log(message)
                res.send(message)
            })

    }).catch((message)=> {
        console.log(message)
        res.send(message)
    })
})

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`)
})




//############################################

// Convert from FILETIME to UTC time
function fileTimeToDate( fileTime ) { 
   let newDate = new Date ( fileTime / 10000 - 11644473600000 );
   newDate = newDate.toUTCString()
   return newDate
};	

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

async function callDb(){
    return new Promise ((resolve, reject)=> {
    let db = new sqlite3.Database('C:\\TwinCAT\\3.1\\Boot\\LoggedEvents.db');
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
            FROM Entities LEFT JOIN Events ON Events.EntityId = Entities.Id LEFT JOIN AlarmState ON AlarmState.EntityId = Entities.Id  GROUP BY Entities.Id ORDER BY Entities.Id DESC`;

        // first row only
        db.all(sql, [], (err, row) => {
            if (err) {
                reject(err.message)
            } else {

                let workbook = new Excel.Workbook() 
                workbook.xlsx.readFile("./WindWings_Report_Template.xlsx").then(()=>{
                    let worksheet = workbook.getWorksheet(1);
                    let getRowInsert
                    for(let i =0; i<row.length; i++){
                        getRowInsert = worksheet.getRow(7+i);
                        getRowInsert.getCell('A').value = row[i].EntityId
                        getRowInsert.getCell('B').value = row[i].EventId
                        getRowInsert.getCell('C').value = row[i].AlarmDisplayText
                        getRowInsert.getCell('D').value = severity(row[i].Severity)
                        getRowInsert.getCell('E').value = ConfirmationState(row[i].ConfirmationState)
                        getRowInsert.getCell('F').value = fileTimeToDate(row[i].TimeRaised)
                        getRowInsert.getCell('G').value = fileTimeToDate(row[i].TimeConfrimed)
                        getRowInsert.getCell('H').value = fileTimeToDate(row[i].TimeCleared)
                        getRowInsert.commit();
                    }
                    
                    workbook.xlsx.writeFile('./public/WindWings_Report.xlsx').then(()=> {
                        resolve("Done!")
                    });                 
                    
                })
            } 
        });
    // close the database connection
    db.close()
    
})
}

async function toPDF() {
    return new Promise ((resolve, reject)=> {
        const extend = '.pdf'
        const enterPath = path.join(__dirname, './public/WindWings_Report.xlsx');
        const outputPath = path.join(__dirname, `./public/WindWings_Report${extend}`);
        
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
            resolve("Done!")
        });
        
    })
}