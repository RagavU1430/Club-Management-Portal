import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    form: { type: mongoose.Schema.Types.ObjectId, ref: "Form", required: true, index: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", default: null },
    // Ordered answers: [{ label, name, value }] — label kept so exports stay readable
    // even if the form is later edited.
    answers: {
      type: [
        new mongoose.Schema(
          { label: String, name: String, value: mongoose.Schema.Types.Mixed },
          { _id: false }
        ),
      ],
      default: [],
    },
    submittedAt: { type: Date, default: Date.now },
    meta: {
      ip: String,
      userAgent: String,
      referrer: String,
    },
  },
  { timestamps: true }
);

submissionSchema.index({ form: 1, submittedAt: -1 });

export default mongoose.models.Submission || mongoose.model("Submission", submissionSchema);