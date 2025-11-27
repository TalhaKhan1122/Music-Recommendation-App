import { Schema, model, Document } from 'mongoose';

export interface IFavoriteTrack extends Document {
  user: Schema.Types.ObjectId;
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
  createdAt: Date;
  updatedAt: Date;
}

const FavoriteTrackSchema = new Schema<IFavoriteTrack>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
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
    timestamps: true,
  }
);

FavoriteTrackSchema.index({ user: 1, trackId: 1 }, { unique: true });

const FavoriteTrack = model<IFavoriteTrack>('FavoriteTrack', FavoriteTrackSchema);

export default FavoriteTrack;

