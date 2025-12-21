import { Project, SyntaxKind } from "ts-morph";
import { KGRelation } from "../types/kg.types";

export function extractMethodCalls(project: Project): KGRelation[] {
    const relations: KGRelation[] = [];

    project.getSourceFiles().forEach(file => {
        file.getClasses().forEach(cls => {
            const className = cls.getName();

            cls.getMethods().forEach(method => {
                const fromMethodId = `method:${className}.${method.getName()}`;

                method
                    .getDescendantsOfKind(SyntaxKind.CallExpression)
                    .forEach(call => {
                        const symbol = call.getExpression().getSymbol();
                        if (!symbol) return;

                        const decl = symbol.getDeclarations()?.[0];
                        const parent = decl?.getFirstAncestorByKind(SyntaxKind.MethodDeclaration);
                        if (!parent) return;

                        const targetClass = parent.getFirstAncestorByKind(
                            SyntaxKind.ClassDeclaration
                        )?.getName();

                        if (!targetClass) return;

                        const toMethodId = `method:${targetClass}.${parent.getName()}`;

                        relations.push({
                            from: fromMethodId,
                            to: toMethodId,
                            type: "CALLS",
                        });
                    });
            });
        });
    });

    return relations;
}
