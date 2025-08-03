# Ratings Sync for Poweramp

> Another way to categorize rated music

## Use case

1. Poweramp with "Like/Dislike" option enabled
2. Music folder synced with your PC (Resilio Sync or similar)

## How it works

- Using Poweramp's backup feature, we export track ratings data
- **Liked (5 stars)** tracks will be moved to `rated_subsolder`. **Disliked (1 star)** tracks will be deleted

## Sync folder schema

```text
|- <file_folder> - sync folder with music
  |--- <local_subfolder> - all music
  |--- <rated_subfolder> - rated music
```

### Example

```text
PC:
|- C:\Sync\Music
  |--- All
  |--- rated
```

```text
Phone:
|- primary/Sync/Music
  |--- All
  |--- rated
```

## Preparations

1. Install Node.js (latest LTS) and pnpm
2. Clone this repository
3. Install dependencies with `pnpm install`
4. Rename `settings.json.example` to `settings.json`
5. Fill `settings.json`:
   - `file_folder`: path to the sync folder on PC
   - `remote_path`: path to the sync folder on the phone
   - `local_subfolder`: name of the folder with music inside sync folder
   - `rated_subfolder`: name of the folder to move rated music to
6. Export Ratings data from Poweramp
   - Settings ->
   - Leave one checkmark on **Ratings and track statistics** ->
   - Export the file to `remote_path` folder
7. Sync the data to PC
8. Run the utility
   - `npm run dry` to see the upcoming changes
   - `npm run commit` to commit changes in your filesystem
9. _(optional)_ Perform **Full Rescan** in Poweramp to update file paths in the Library
