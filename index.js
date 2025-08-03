import { fileURLToPath } from "url"
import { join, extname, normalize, dirname, basename } from "path"
import { existsSync } from "fs"
import { cp, readFile, readdir, unlink } from "fs/promises"
import decompress from "decompress"
import Database from "better-sqlite3"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const settingsFile = join(__dirname, "settings.json")
if (!existsSync(settingsFile)) throw new Error("Settings file does not exist!")

const settings = JSON.parse(await readFile(settingsFile))

const TEMP_FOLDER = join(__dirname, "temp")
const LIST_EXPORT_FILE = join(TEMP_FOLDER, "lists-export")
const EXTENSION = ".poweramp-backup"

const FILE_FOLDER = normalize(settings.file_folder)
const REMOTE_PATH = settings.remote_path
const LOCAL_PATH = join(FILE_FOLDER, settings.local_subfolder)
const RATED_SUBFOLDER = settings.rated_subfolder

const DRY_RUN = process.argv.includes("--dry")
console.log("### Rating Sync for Poweramp")
console.log(DRY_RUN ? "Dry run. No changes." : "!!! Commiting changes...")

// Loading backup folder
const backupFiles = await readdir(FILE_FOLDER)
// console.debug("backupFiles: ", backupFiles)

// Check for eligible files
const targetFiles = backupFiles.filter((file) => {
  return extname(file).toLowerCase() === EXTENSION
})
if (targetFiles.length === 0)
  throw new Error(`Put backup file in ${FILE_FOLDER}`)
if (targetFiles.length > 1) throw new Error("Only one backup file supported!")
console.debug("targetFiles: ", targetFiles)

// Unzip backup file
const backupFile = join(FILE_FOLDER, targetFiles[0])
await decompress(backupFile, TEMP_FOLDER)

// Load lists export db
const db = new Database(LIST_EXPORT_FILE, { verbose: console.debug })
db.pragma("journal_mode = WAL")

// Extract paths
const stmt = db.prepare(`
    SELECT path, rating, readable_name
    FROM tracks 
    WHERE rating > 0 
    ORDER BY rating DESC
`)
const tracks = stmt.all()
console.debug(tracks)

tracks.forEach(async (track) => {
  const localPath = join(LOCAL_PATH, track.path.replace(REMOTE_PATH, ""))
  const ratedPath = join(LOCAL_PATH, RATED_SUBFOLDER, basename(localPath))
  if (localPath === ratedPath) return

  console.log(`Current file: ${track.readable_name} | rated ${track.rating}`)

  if (!existsSync(localPath)) {
    console.warn("File not found: ", track.path)
    return
  }

  if (track.rating === 5) {
    console.log("...copying to", ratedPath)
    if (!DRY_RUN) {
      await cp(localPath, ratedPath, { force: true })
      await unlink(localPath)

      return
    }
  }

  if (track.rating === 1) {
    console.log("...removing")
    if (!DRY_RUN) await unlink(localPath)
  }
})

// Clear temp folder
db.close()
if (existsSync(LIST_EXPORT_FILE)) unlink(LIST_EXPORT_FILE)

console.log("DONE!")
