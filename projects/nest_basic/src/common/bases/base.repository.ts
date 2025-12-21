import { FilterQuery, Model, ProjectionFields, Types, UpdateQuery } from 'mongoose';
import mongodb from 'mongodb';

export class BaseRepository<T> {
    private readonly model: Model<T>;

    constructor(model: Model<T>) {
        this.model = model;
    }

    async getAll(params: FilterQuery<T>): Promise<T[]> {
        return this.model.find(params);
    }

    async getAllByField(params: FilterQuery<T>): Promise<T[]> {
        return this.model.find(params);
    }

    async getByField(params: FilterQuery<T>): Promise<T> {
        return this.model.findOne(params);
    }

    async getById(id: Types.ObjectId | string): Promise<T> {
        return this.model.findById(id);
    }

    async getCountByParam(params: FilterQuery<T>): Promise<number> {
        return this.model.countDocuments(params);
    }

    async save(body: Partial<T>): Promise<T> {
        return this.model.create(body);
    }

    async updateById(data: UpdateQuery<T>, id: string | Types.ObjectId): Promise<T> {
        return this.model.findByIdAndUpdate(id, data, { new: true });
    }

    async getDistinctDocument(field: string, params: FilterQuery<T>): Promise<unknown[]> {
        return this.model.distinct(field, params);
    }

    async getAllByFieldWithProjection(params: FilterQuery<T>, projection: ProjectionFields<T>): Promise<T[]> {
        return this.model.find(params, projection);
    }

    async getByFieldWithProjection(params: FilterQuery<T>, projection: ProjectionFields<T>): Promise<T> {
        return this.model.findOne(params, projection);
    }

    async delete(id: string | Types.ObjectId): Promise<T> {
        return this.model.findByIdAndDelete(id);
    }

    async bulkDelete(params: FilterQuery<T>) {
        return this.model.deleteMany(params);
    }

    async updateByField(data: UpdateQuery<T>, param: FilterQuery<T>) {
        return this.model.updateOne(param, data);
    }

    async updateAllByParams(data: Partial<T>, params: FilterQuery<T>) {
        return this.model.updateMany(params, { $set: data });
    }

    async bulkDeleteSoft(ids: Types.ObjectId[] | string[]) {
        return this.model.updateMany({ _id: { $in: ids } }, { $set: { isDeleted: true } });
    }

    async saveOrUpdate(data: UpdateQuery<T>, id: string | Types.ObjectId) {
        return this.model.findOneAndUpdate({ _id: id }, data, {
            upsert: true,
            new: true
        });
    }
}
