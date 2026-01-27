import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { Policy, PolicySchema } from './schemas/policy.schema';

@Module({
    imports: [DiscoveryModule, MongooseModule.forFeature([{ name: Policy.name, schema: PolicySchema }])],
})
export class PolicyModule {}
