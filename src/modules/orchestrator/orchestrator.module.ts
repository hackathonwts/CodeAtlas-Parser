import { Module } from '@nestjs/common';
import { OrchestratorService } from './orchestrator.service';
import { GitManagerModule } from '../git-manager/git-manager.module';
import { AstParserModule } from '../ast-parser/ast-parser.module';
import { IngestionModule } from '../ingestion/ingestion.module';

@Module({
    imports: [
        GitManagerModule,
        AstParserModule,
        IngestionModule,
    ],
    providers: [OrchestratorService],
    exports: [OrchestratorService],
})
export class OrchestratorModule {}