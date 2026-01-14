import { IProject } from "./models/project.model";
import { Documentation } from "./types/kg.types";
import { DescriptionModel } from "./models/projectDescriptions.model";
import { MarkdownModel } from "./models/projectMD.model";


export default async function dumpDoc(project: IProject, documentation: Documentation) {
    try {
        // dump markdowns to db
        if (documentation.markdown.length > 0) {
            const markdowns = documentation.markdown.map((markdown) => {
                return {
                    ...markdown,
                    projectId: project._id,
                    scanVersion: project.scanVersion,
                };
            });
            await MarkdownModel.deleteMany({ projectId: project._id });
            await MarkdownModel.insertMany(markdowns);
        }

        // dump descriptions to db
        if (documentation.descriptions.length > 0) {
            const descriptions = documentation.descriptions.map((description) => {
                return {
                    ...description,
                    projectId: project._id,
                    scanVersion: project.scanVersion,
                };
            });
            await DescriptionModel.deleteMany({ projectId: project._id });
            await DescriptionModel.insertMany(descriptions);
        }
    } catch (error) {
        throw error;
    }

}