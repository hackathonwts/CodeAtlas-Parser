import { Module } from '@nestjs/common';
import { GitManagerService } from './git-manager.service';

@Module({
    providers: [GitManagerService],
    exports: [GitManagerService],
})
export class GitManagerModule {}