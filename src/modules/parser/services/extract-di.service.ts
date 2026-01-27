import { Injectable } from '@nestjs/common';
import { Project } from "ts-morph";
import { KGRelation } from "../../../types/kg.types";

@Injectable()
export class ExtractDIService {
    
    extractDI(project: Project): KGRelation[] {
        const relations: KGRelation[] = [];

        project.getSourceFiles().forEach(file => {
            file.getClasses().forEach(cls => {
                const classId = `class:${cls.getName()}`;
                const ctor = cls.getConstructors()[0];
                if (!ctor) return;

                ctor.getParameters().forEach(param => {
                    const type = param.getType().getSymbol()?.getName();
                    if (!type) return;

                    relations.push({
                        from: classId,
                        to: `class:${type}`,
                        type: "INJECTS",
                    });
                });
            });
        });

        return relations;
    }
}