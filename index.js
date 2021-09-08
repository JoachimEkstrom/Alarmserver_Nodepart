import express from 'express'
const app = express()
const port = 4000
import cors from 'cors'
app.use(cors())
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use(express.static('public'))

import * as sql from './SQLite/SQL.js'
//const sql = require('./SQLite/SQL.js')
import * as influxdb from './InfluxDb/InfluxDb.js'
//const influxdb = require('./InfluxDb/InfluxDb.mjs')

// SQLite DataBase

app.get('/xlsx', async (req, res) => {

    let dbPromise = sql.callDb()

    dbPromise.then(()=> {
        res.sendFile('./public/WindWings_Report.xlsx', { root: __dirname })
    }).catch(()=>{
        res.send(error)
    })

})

app.get('/pdf', async (req, res) => {

    let dbPromise = sql.callDb()
    dbPromise.then(()=> {

            let pdfPromise = sql.toPDF()
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





