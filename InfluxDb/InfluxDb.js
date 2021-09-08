import fetch from 'node-fetch'

export function getAll(){
    return new Promise ((resolve, reject)=> {

        fetch("http://localhost:8086/query?pretty=true&db=SensorData&q=SELECT * FROM PtData")
        .then(response => response.json())
        .then(data => {
            console.log(data)
            if (!data) {
                reject("ERR")
            }else {
                resolve(data)
            }

        })
    })
}
