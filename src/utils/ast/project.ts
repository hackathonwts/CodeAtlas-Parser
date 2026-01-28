import { Project } from 'ts-morph';

export function loadProject(basePath: string = '.'): Project {
    return new Project({
        tsConfigFilePath: basePath + 'tsconfig.json',
        skipAddingFilesFromTsConfig: false,
    });
}
