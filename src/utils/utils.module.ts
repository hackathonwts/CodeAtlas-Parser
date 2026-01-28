import { Global, Module } from "@nestjs/common";
import { GitUtils } from "./git.utils";

@Global()
@Module({
    providers: [
        GitUtils
    ],
    exports: [
        GitUtils
    ]
})
export class UtilsModule {}