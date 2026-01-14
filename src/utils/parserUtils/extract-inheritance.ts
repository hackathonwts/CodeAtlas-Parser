import { Project, SyntaxKind } from "ts-morph";
import { KGRelation } from "../../types/kg.types";

/**
 * Extracts inheritance and implementation relationships.
 * - Class extends Class
 * - Class implements Interface
 * - Interface extends Interface
 */
export function extractInheritance(project: Project): KGRelation[] {
    const relations: KGRelation[] = [];

    project.getSourceFiles().forEach(file => {
        // Extract class inheritance
        file.getClasses().forEach(cls => {
            const className = cls.getName();
            if (!className) return;

            const classId = `class:${className}`;

            // Check for extends clause
            const extendsClause = cls.getExtends();
            if (extendsClause) {
                const baseClassName = extendsClause.getExpression().getText();
                addUniqueRelation(relations, {
                    from: classId,
                    to: `class:${baseClassName}`,
                    type: "EXTENDS",
                });
            }

            // Check for implements clause
            cls.getImplements().forEach(impl => {
                const interfaceName = impl.getExpression().getText();
                addUniqueRelation(relations, {
                    from: classId,
                    to: `interface:${interfaceName}`,
                    type: "IMPLEMENTS",
                });
            });

            // Check for decorators that might indicate patterns (like @Injectable, @Entity, etc.)
            cls.getDecorators().forEach(decorator => {
                const decoratorName = decorator.getName();
                if (decoratorName) {
                    addUniqueRelation(relations, {
                        from: classId,
                        to: `decorator:${decoratorName}`,
                        type: "DECORATED_BY",
                    });
                }
            });
        });

        // Extract interface inheritance
        file.getInterfaces().forEach(iface => {
            const ifaceName = iface.getName();
            const ifaceId = `interface:${ifaceName}`;

            iface.getExtends().forEach(ext => {
                const baseInterfaceName = ext.getExpression().getText();
                addUniqueRelation(relations, {
                    from: ifaceId,
                    to: `interface:${baseInterfaceName}`,
                    type: "EXTENDS",
                });
            });
        });
    });

    return relations;
}

function addUniqueRelation(relations: KGRelation[], relation: KGRelation): void {
    const exists = relations.some(
        r => r.from === relation.from && r.to === relation.to && r.type === relation.type
    );
    if (!exists) {
        relations.push(relation);
    }
}
