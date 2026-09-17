import mongoose from "mongoose";

const teamMemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true },
    role: { type: String, required: [true, "Role is required"], trim: true, index: true },
    department: { type: String, trim: true, default: "" },
    photo: { type: String, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    linkedin: { type: String, trim: true, default: "" },
    github: { type: String, trim: true, default: "" },
    bio: { type: String, trim: true, maxlength: 600, default: "" },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

teamMemberSchema.index({ name: "text", role: "text", bio: "text" });

export default mongoose.models.TeamMember || mongoose.model("TeamMember", teamMemberSchema);