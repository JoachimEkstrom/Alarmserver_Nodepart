import express from 'express'
const app = express()
const port = 4000
import cors from 'cors'
app.use(cors())
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use(express.static('public'))

import * as sql from './SQLite/SQL.js'
import * as influxdb from './InfluxDb/InfluxDb.js'

// SQLite DataBase

// Get all data from Alarmserver
app.get('/xlsx', async (req, res) => {

    let dbPromise = sql.callDb()
    dbPromise.then((message)=> {
        console.log(message)
        res.sendFile('./public/WindWings_Report.xlsx' , { root: './' })
    }).catch((error)=>{
        res.send(error)
    })

})

// Get data from a selected time frame from alarmserver
app.post('/xlsxTime', async (req, res) => {
    console.log(Date.parse(req.body.fromDate))
    let dbPromise = sql.callDb(Date.parse(req.body.fromDate))
    dbPromise.then((message)=> {
        console.log(message)
        res.sendFile('./public/WindWings_Report.xlsx' , { root: './' })
    }).catch((error)=>{
        res.send(error)
    })

})

app.get('/pdf', async (req, res) => {

    let dbPromise = sql.callDb()
    dbPromise.then(()=> {

            let pdfPromise = sql.toPDF()
            pdfPromise.then(()=>{
                res.sendFile('./public/WindWings_Report.pdf', { root: './' })
            }).catch((message)=>{
                console.log(message)
                res.send(message)
            })

    }).catch((message)=> {
        console.log(message)
        res.send(message)
    })
})

app.post('/pdfTime', async (req, res) => {
    console.log(Date.parse(req.body.fromDate))
    let dbPromise = sql.callDb(Date.parse(req.body.fromDate))
    dbPromise.then((message)=> {
            console.log(message)
            let pdfPromise = sql.toPDF()
            pdfPromise.then((message)=>{
                console.log(message)
                res.sendFile('./public/WindWings_Report.pdf', { root: './' })
            }).catch((message)=>{
                console.log(message)
                res.send(message)
            })

    }).catch((message)=> {
        console.log(message)
        res.send(message)
    })
})

// InfluxDb 


app.get('/influxdb', async (req, res) => {

    let dbPromise = influxdb.getAll()
    dbPromise.then((data)=> {

        res.send(data)

    }).catch((message)=> {
        console.log(message)
        res.send(message)
    })
})






app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`)
})





