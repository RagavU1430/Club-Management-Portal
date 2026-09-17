import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "Title is required"], trim: true, maxlength: 140 },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    date: { type: Date, required: [true, "Event date is required"] },
    endDate: { type: Date },
    venue: { type: String, trim: true, default: "" },
    description: { type: String, required: [true, "Description is required"], trim: true },
    summary: { type: String, trim: true, maxlength: 220, default: "" },
    image: { type: String, default: "" },
    registrationLink: { type: String, trim: true, default: "" },
    tags: { type: [String], default: [] },
    // "upcoming" | "past" are derived from the date; status handles draft/published/cancelled.
    status: { type: String, enum: ["draft", "published", "cancelled"], default: "published", index: true },
    featured: { type: Boolean, default: false },
    capacity: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

eventSchema.virtual("computedStatus").get(function computedStatus() {
  if (this.status === "draft") return "draft";
  if (this.status === "cancelled") return "cancelled";
  return this.date && this.date.getTime() > Date.now() ? "upcoming" : "past";
});

eventSchema.index({ date: -1, status: 1 });

export default mongoose.models.Event || mongoose.model("Event", eventSchema);