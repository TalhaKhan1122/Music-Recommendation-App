import { Schema, model, Document } from 'mongoose';

export interface IPlaylistTrack {
  trackId: string;
  name: string;
  artists?: string;
  album?: string;
  albumImage?: string;
  externalUrl?: string;
  previewUrl?: string;
  source?: string;
  mood?: string;
  addedAt: Date;
}

export interface IPlaylist extends Document {
  user: Schema.Types.ObjectId;
  name: string;
  description?: string;
  tracks: IPlaylistTrack[];
  createdAt: Date;
  updatedAt: Date;
}

const PlaylistTrackSchema = new Schema<IPlaylistTrack>(
  {
    trackId: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    artists: {
      type: String,
      trim: true,
    },
    album: {
      type: String,
      trim: true,
    },
    albumImage: {
      type: String,
      trim: true,
    },
    externalUrl: {
      type: String,
      trim: true,
    },
    previewUrl: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      default: 'spotify',
      trim: true,
    },
    mood: {
      type: String,
      trim: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
  }
);

const PlaylistSchema = new Schema<IPlaylist>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    tracks: {
      type: [PlaylistTrackSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

PlaylistSchema.index({ user: 1, name: 1 }, { unique: true });
PlaylistSchema.index({ user: 1, updatedAt: -1 });

const Playlist = model<IPlaylist>('Playlist', PlaylistSchema);

export default Playlist;

