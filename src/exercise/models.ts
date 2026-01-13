import mongoose, { Schema, Document } from "mongoose";

export const BODY_PARTS = ["chest", "shoulders", "arms", "legs", "core"] as const

export const EQUIPMENT = [
  "barbell",
  "plates",
  "bench",
  "incline bench",
  "dumbbell",
  "squat rack",
  "leg extension machine",
  "nordic curl bench"
] as const

export type BodyPart = typeof BODY_PARTS[number]
export type Equipment = typeof EQUIPMENT[number]

export interface IExercise extends Document {
    name: string;
    desc: string;
    tutorial: string;
    image: string;
    equipment?: Equipment
    bp: BodyPart
}

export const exerciseSchema = new Schema<IExercise>({
    name: { type: String, required: true, unique: true },
    desc: { type: String, required: true},
    tutorial: { type: String, required: true },
    image: { type: String },
    equipment: { type: String, 
        enum: EQUIPMENT
    },
    bp: { type: String, required: true,
        enum: BODY_PARTS
    },
}, { strict: 'throw', timestamps: true });

export type ExerciseDoc = IExercise & Document;
export const Exercise = mongoose.model<IExercise>("Exercise", exerciseSchema);