import { Schema, model, Document } from 'mongoose';

export interface IStationArtist {
  id: string;
  name: string;
  image?: string;
}

export interface IStation extends Document {
  user: Schema.Types.ObjectId;
  name: string;
  artists: IStationArtist[];
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

const StationArtistSchema = new Schema<IStationArtist>(
  {
    id: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const StationSchema = new Schema<IStation>(
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
    artists: {
      type: [StationArtistSchema],
      required: true,
      validate: {
        validator: function(v: IStationArtist[]) {
          return v.length >= 2 && v.length <= 5;
        },
        message: 'Station must have between 2 and 5 artists',
      },
    },
    color: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

StationSchema.index({ user: 1, createdAt: -1 });

const Station = model<IStation>('Station', StationSchema);

export default Station;

