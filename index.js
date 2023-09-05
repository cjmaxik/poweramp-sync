import { fileURLToPath } from 'url'
import { join, extname, normalize, dirname, basename } from 'path'
import { existsSync } from 'fs'
import { cp, readFile, readdir, unlink } from 'fs/promises'
import { open } from 'sqlite'
import sqlite3 from 'sqlite3'
import decompress from 'decompress'
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const settingsFile = join(__dirname, 'settings.json')
if (!existsSync(settingsFile)) throw new Error('Settings file does not exist!')

const settings = JSON.parse(await readFile(settingsFile))
console.debug(settings)

const TEMP_FOLDER = join(__dirname, 'temp')
const LIST_EXPORT_FILE = join(TEMP_FOLDER, 'lists-export')
const EXTENSION = '.poweramp-backup'

const FILE_FOLDER = normalize(settings.file_folder)
const REMOTE_PATH = settings.remote_path
const LOCAL_PATH = join(FILE_FOLDER, settings.local_subfolder)
const RATED_SUBFOLDER = settings.rated_subfolder

const DRY_RUN = settings.dry_run
console.log(DRY_RUN ? 'dry_run' : 'PROD')

// Loading backup folder
const backupFiles = await readdir(FILE_FOLDER)
console.debug('backupFiles: ', backupFiles)

// Check for eligible files
const targetFiles = backupFiles.filter(file => {
  return extname(file).toLowerCase() === EXTENSION
})
if (targetFiles.length === 0) throw new Error(`Put backup file in ${FILE_FOLDER}`)
if (targetFiles.length > 1) throw new Error('Only one backup file supported!')
console.debug('targetFiles: ', targetFiles)

// Unzip backup file
const backupFile = join(FILE_FOLDER, targetFiles[0])
await decompress(backupFile, TEMP_FOLDER)

// Load lists export db
const db = await open({
  filename: LIST_EXPORT_FILE,
  driver: sqlite3.Database
})
console.debug(db)

// Extract paths
const tracks = await db.all(`
    SELECT path, rating, readable_name
    FROM tracks 
    WHERE rating > 0 
    ORDER BY rating DESC
`)
console.debug(tracks)

tracks.forEach(async track => {
  const localPath = join(LOCAL_PATH, track.path.replace(REMOTE_PATH, ''))
  const ratedPath = join(LOCAL_PATH, RATED_SUBFOLDER, basename(localPath))
  if (localPath === ratedPath) return

  console.log(`Current file: ${track.readable_name} | rated ${track.rating}`)

  if (!existsSync(localPath)) {
    console.warn('File not found: ', track.path)
    return
  }

  if (track.rating === 5) {
    console.log('...copying to', ratedPath)
    if (!DRY_RUN) {
      await cp(localPath, ratedPath, { force: true })
      await unlink(localPath)

      return
    }
  }

  if (track.rating === 1) {
    console.log('...removing')
    if (!DRY_RUN) await unlink(localPath)
  }
})

// Clear temp folder
db.close()
if (existsSync(LIST_EXPORT_FILE)) unlink(LIST_EXPORT_FILE)

console.log('DONE!')
