import { model, Schema } from "mongoose";
import slugify from "slugify";

interface IProject {
    _id: Schema.Types.ObjectId;
    gitUrl: string;
    branch: string;
    projectName: string;
    username: string;
    password: string;
    uuid: string;
    scanVersion?: number;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
const projectSchema = new Schema<IProject>({
    gitUrl: { type: String, required: true },
    branch: { type: String, required: true },
    projectName: { type: String, required: true },
    username: { type: String, required: true },
    password: { type: String, required: true },
    uuid: { type: String, required: true, unique: true },
    scanVersion: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
}, {
    timestamps: true,
});

projectSchema.index({ projectName: 1, branch: 1 }, { unique: true });


projectSchema.pre('validate', async function () {
    // Only generate uuid if it doesn't exist (i.e., on creation, not on update)
    if (!this.uuid) {
        // Generate a random 8-character alphanumeric seed
        const seed = Math.random().toString(36).substring(2, 10);
        this.uuid = slugify(`${this.projectName}-${this.branch}-${seed}`, {
            lower: true,
            trim: true,
            replacement: '-'
        });
    }
});


const Project = model<IProject>("Project", projectSchema);

export {
    Project,
    IProject
}