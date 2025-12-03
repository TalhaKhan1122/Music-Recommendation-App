# Lyrics Import Guide

This guide explains how to import lyrics data from a Kaggle dataset into the MongoDB database for the "Find Song by Lyrics" feature.

## Prerequisites

1. **MongoDB Database**: Make sure your MongoDB is running and the connection string is configured in `.env`
2. **Kaggle Dataset**: Download a lyrics dataset from Kaggle (e.g., "Spotify Song Lyrics" or similar)
3. **CSV File**: The dataset should be in CSV format

## CSV Format

The script expects a CSV file with the following columns (case-insensitive, various naming variations supported):

### Required Columns:
- **Track Name**: `track_name`, `track`, `song`, or `name`
- **Artist Name**: `artist_name` or `artist`
- **Lyrics**: `lyrics`, `lyric`, or `text`

### Optional Columns:
- **Album Name**: `album_name` or `album`
- **Spotify Track ID**: `spotify_track_id`, `spotify_id`, or `track_id`

### Example CSV:

```csv
track_name,artist_name,lyrics,album_name
"Bohemian Rhapsody","Queen","Is this the real life? Is this just fantasy?...","A Night at the Opera"
"Imagine","John Lennon","Imagine there's no heaven...","Imagine"
```

## Import Process

### Step 1: Download a Kaggle Dataset

1. Go to [Kaggle Datasets](https://www.kaggle.com/datasets)
2. Search for "lyrics" or "song lyrics"
3. Download a dataset (preferably one with Spotify integration)
4. Extract the CSV file

### Step 2: Place the CSV File

Place your CSV file in a convenient location, for example:
```
backend/data/lyrics_dataset.csv
```

### Step 3: Run the Import Script

```bash
cd backend
npm run import-lyrics ./data/lyrics_dataset.csv
```

Or use an absolute path:
```bash
npm run import-lyrics "C:\path\to\your\lyrics_dataset.csv"
```

### Step 4: Monitor Progress

The script will:
- Show headers found in the CSV
- Display progress every 100 imported songs
- Show warnings for skipped rows (missing data, invalid format, etc.)
- Display a summary at the end

## Example Output

```
📂 Reading CSV file: ./data/lyrics_dataset.csv
🔄 Starting import...

📋 Headers found: track_name, artist_name, lyrics, album_name
✅ Imported 100 songs...
✅ Imported 200 songs...
...

📊 Import Summary:
   Total rows processed: 5000
   ✅ Successfully imported: 4850
   ⚠️  Skipped: 120
   ❌ Errors: 30

✅ Import completed!
```

## Troubleshooting

### Error: "File not found"
- Make sure the file path is correct
- Use absolute paths if relative paths don't work
- Check that the file exists

### Error: "Missing required fields"
- The script will skip rows that don't have track name, artist name, or lyrics
- Check your CSV format matches the expected column names

### Error: "Lyrics too short"
- Rows with lyrics shorter than 20 characters are skipped
- This is intentional to filter out invalid data

### MongoDB Connection Error
- Check your `.env` file has the correct `MONGODB_URI`
- Make sure MongoDB is running
- Verify network connectivity

## Recommended Kaggle Datasets

Here are some popular Kaggle datasets for lyrics:

1. **Spotify Song Lyrics**
   - Contains lyrics for popular songs
   - Often includes Spotify track IDs
   - Search: "spotify lyrics" on Kaggle

2. **Song Lyrics from Multiple Genres**
   - Diverse collection of songs
   - Various genres and artists

3. **Billboard Hot 100 Lyrics**
   - Popular songs from Billboard charts
   - High-quality, verified lyrics

## Notes

- The import process creates word frequency vectors for each song's lyrics
- These vectors are used for similarity matching when users search
- Duplicate songs (same track name + artist) will be updated, not duplicated
- The import can take time for large datasets (1000+ songs)
- Progress is shown every 100 songs

## Next Steps

After importing lyrics:

1. Test the search feature at `/find-with-voice`
2. Try searching with partial lyrics
3. The system will match songs based on word similarity

## Performance Tips

- For large datasets (10,000+ songs), consider importing in batches
- The word frequency calculation happens automatically during import
- MongoDB indexes are created automatically for faster searches

