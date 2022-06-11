import fs from 'node:fs'
import Path from 'node:path'

let synced: {obj: any; path: string}[] = []

const saveSynced = () =>
  synced.forEach(({obj, path}) => fs.writeFileSync(path, JSON.stringify(obj)))

setInterval(saveSynced, 10000)

process.once('SIGINT', () => {
  saveSynced()
  process.exit()
})

export const jsonSynced = (path: string): any => {
  path = Path.join(__dirname, path)
  let file = fs.readFileSync(path, {encoding: 'utf-8'})
  let obj = JSON.parse(file)
  synced.push({obj, path})
  return obj
}
