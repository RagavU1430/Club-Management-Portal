import mongoose from "mongoose";

const fieldSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["text", "email", "phone", "number", "textarea", "select", "radio", "checkbox", "date", "url"],
      default: "text",
    },
    placeholder: { type: String, default: "" },
    helpText: { type: String, default: "" },
    required: { type: Boolean, default: false },
    options: { type: [String], default: [] }, // for select / radio / checkbox
    order: { type: Number, default: 0 },
  },
  { _id: true }
);

const formSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "Form title is required"], trim: true },
    description: { type: String, trim: true, default: "" },
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", default: null },
    fields: { type: [fieldSchema], default: [] },
    published: { type: Boolean, default: true },
    submissionCount: { type: Number, default: 0 },
    closesAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.Form || mongoose.model("Form", formSchema);