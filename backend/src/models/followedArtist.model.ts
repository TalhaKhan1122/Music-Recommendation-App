import mongoose, { Document, Schema } from 'mongoose';

export interface IFollowedArtist extends Document {
  user: Schema.Types.ObjectId;
  artistId: string;
  name: string;
  image?: string;
  genres?: string[];
  followers?: number;
  popularity?: number;
  spotifyUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FollowedArtistSchema = new Schema<IFollowedArtist>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    artistId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
    },
    genres: {
      type: [String],
      default: undefined,
    },
    followers: {
      type: Number,
    },
    popularity: {
      type: Number,
    },
    spotifyUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

FollowedArtistSchema.index(
  { user: 1, artistId: 1 },
  {
    unique: true,
    name: 'idx_followed_artist_user_artistId',
  }
);

const FollowedArtist = mongoose.model<IFollowedArtist>('FollowedArtist', FollowedArtistSchema);

export default FollowedArtist;


