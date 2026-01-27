import { Injectable } from "@nestjs/common";
import { existsSync, mkdirSync, rmSync } from "fs";
import { join } from "path";


@Injectable()
export class HelperUtils {
    getProjectPath(projectTitle: string): string {
        const projectTitleSanitized = projectTitle.replace(/\s+/g, '_').toLowerCase();
        const p_path = join(process.cwd(), 'projects', projectTitleSanitized);
        if (!existsSync(p_path)) {
            mkdirSync(p_path, { recursive: true });
        } else {
            rmSync(p_path, { recursive: true, force: true });
            mkdirSync(p_path, { recursive: true });
        }
        return p_path;
    }
}