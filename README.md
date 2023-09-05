# Rating Sync for Poweramp

> Another way to categorize rated music

## Use case

1. Poweramp with "Like/Dislike" option enabled.
2. Music folder synced with your PC (Resilio Sync or similar).

## How it works

- Using Poweramp's backup feature, we export track rating data.
- **Liked (5 stars)** tracks will be moved to `rated_subsolder`. **Disliked (1 star)** tracks will be deleted.

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

1. Install Node.js (latest LTS)
2. Clone this repository
3. `npm install`
4. Rename `settings.json.example` to `settings.json`
5. Fill `settings.json`:
    - `dry_run`: if `true`, does not move/delete files; set to `false` to make permanent changes
    - `file_folder`: path to the sync folder on PC
    - `remote_path`: path to the sync folder on the phone
    - `local_subfolder`: name of the folder with music inside sync folder
    - `rated_subfolder`: name of the folder to move rated music to
