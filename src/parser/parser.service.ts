import { Injectable, Logger } from '@nestjs/common';
import parser from '../parser';
import { KGNode, KGRelation, Documentation } from '../types/kg.types';

@Injectable()
export class ParserService {
    private readonly logger = new Logger(ParserService.name);

    /**
     * Parse a TypeScript project and extract knowledge graph
     */
    parse(projectPath: string): { nodes: KGNode[]; relations: KGRelation[]; documentation: Documentation } {
        this.logger.log(`Parsing project at: ${projectPath}`);

        try {
            const result = parser(projectPath);

            this.logger.log(`✅ Parsed ${result.nodes.length} nodes and ${result.relations.length} relations`);

            return result;
        } catch (error) {
            this.logger.error('Failed to parse project:', error);
            throw error;
        }
    }
}
