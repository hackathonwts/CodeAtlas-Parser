import { Global, Module } from "@nestjs/common";
import { GitUtils } from "./git.utils";
import { HelperUtils } from "./helper.utils";

@Global()
@Module({
    providers: [
        GitUtils,
        HelperUtils
    ],
    exports: [
        GitUtils,
        HelperUtils
    ]
})
export class UtilsModule {}