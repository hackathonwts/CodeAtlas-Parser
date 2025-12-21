import { CUSTOM_SWAGGER_META } from '@common/decorator/api-group.decorator';
import { INestApplication } from '@nestjs/common';
import { DiscoveryService, Reflector } from '@nestjs/core';
import { OpenAPIObject } from '@nestjs/swagger';

export function patchSwaggerDoc(app: INestApplication, document: OpenAPIObject, enableSwaggerPatch: boolean) {
    if (!enableSwaggerPatch) return { sggrGroups: new Map<string, any>(), defaultDoc: document };

    const API_GROUP_KEY = 'x-api-group';
    const dc = app.get<DiscoveryService>(DiscoveryService);
    const rf = app.get<Reflector>(Reflector);
    const controllers = dc.getControllers();
    const controllerGp = new Map<string, string>();

    for (const wrapper of controllers) {
        const { instance } = wrapper;
        if (!instance) continue;
        const controllerMeta = rf.get(CUSTOM_SWAGGER_META, instance.constructor);
        if (controllerMeta) {
            controllerGp.set(instance.constructor.name, controllerMeta);
        }
    }

    for (const [_p, _pI] of Object.entries(document.paths)) {
        for (const [_m, _o] of Object.entries(_pI as any)) {
            if (_o && typeof _o === 'object' && 'operationId' in _o) {
                const operationId = (_o as any).operationId;
                if (operationId) {
                    const cN = operationId.split('_')[0];
                    const gN = controllerGp.get(cN);
                    if (gN) (_o as any)[API_GROUP_KEY] = gN;
                }
            }
        }
    }

    const sggrGroups = new Map<string, any>();
    const defaultDoc = { ...document, paths: {} };

    Object.entries(document.paths).forEach(([path, pathItem]) => {
        Object.entries(pathItem as any).forEach(([method, operation]) => {
            if (operation[API_GROUP_KEY]) {
                const groupName = operation[API_GROUP_KEY];
                if (!sggrGroups.has(groupName)) {
                    sggrGroups.set(groupName, {
                        ...document,
                        paths: {},
                        info: {
                            ...document.info,
                            title: `${document.info.title} - ${groupName}`,
                            description: `${groupName} API endpoints`
                        }
                    });
                }
                const groupDoc = sggrGroups.get(groupName);
                if (!groupDoc.paths[path]) groupDoc.paths[path] = {};
                groupDoc.paths[path][method] = operation;
            } else {
                if (!defaultDoc.paths[path]) defaultDoc.paths[path] = {};
                defaultDoc.paths[path][method] = operation;
            }
        });
    });

    return { sggrGroups, defaultDoc };
}
