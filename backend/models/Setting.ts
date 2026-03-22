import mongoose, { Schema, Document } from "mongoose";

export interface ISetting extends Document {
  key: string;
  value: any;
  label: string;
  description?: string;
  category: string;
}

const SettingSchema: Schema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true },
    label: { type: String, required: true },
    description: String,
    category: { type: String, default: "general" }
  },
  { timestamps: true }
);

export default mongoose.model<ISetting>("Setting", SettingSchema);
