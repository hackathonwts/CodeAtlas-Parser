import { Project } from 'ts-morph';
import { KGNode, KGRelation } from '../../types/kg.types';

const HTTP_DECORATORS = ['Get', 'Post', 'Put', 'Delete', 'Patch'];

export function extractRoutes(project: Project): { nodes: KGNode[]; relations: KGRelation[] } {
    const nodes: KGNode[] = [];
    const relations: KGRelation[] = [];

    project.getSourceFiles().forEach((file) => {
        file.getClasses().forEach((cls) => {
            const controllerPath = cls.getDecorator('Controller')?.getArguments()?.[0]?.getText()?.replace(/['"]/g, '') || '';

            cls.getMethods().forEach((method) => {
                const decorator = method.getDecorators().find((d) => HTTP_DECORATORS.includes(d.getName()));
                if (!decorator) return;

                const httpMethod = decorator.getName().toUpperCase();
                const routePath = decorator.getArguments()?.[0]?.getText()?.replace(/['"]/g, '') || '';

                const routeId = `route:${httpMethod}:${controllerPath}/${routePath}`;

                nodes.push({
                    id: routeId,
                    kind: 'Route',
                    name: `${httpMethod} /${controllerPath}/${routePath}`,
                    meta: { httpMethod, path: `/${controllerPath}/${routePath}` },
                });

                relations.push({
                    from: `method:${cls.getName()}.${method.getName()}`,
                    to: routeId,
                    type: 'HANDLES_ROUTE',
                });
            });
        });
    });

    return { nodes, relations };
}
