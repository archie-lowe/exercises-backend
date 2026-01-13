import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../../src/app.js';
import { Exercise, exerciseSchema } from '../../src/exercise/models.js';

describe('GET exercises', () => {
    let mongoServer: MongoMemoryServer;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create()
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
    })

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    })

    beforeEach(async () => {
        await Exercise.create([
            { name: 'shoulder',  desc: 'testing testing shoulder', tutorial: 'helpful tutorial', bp: 'shoulders'},
            { name: 'arms',  desc: 'testing testing arms', tutorial: 'helpful tutorial', bp: 'arms'},
            { name: 'chest',  desc: 'testing testing chest', tutorial: 'helpful tutorial', bp: 'chest'}
        ])
    })

    afterEach(async () => {
        // Clear data after each test
        await Exercise.deleteMany({})
    });

    it('should return exercises', async () => {
        const res = await request(app).get('/v1/exercises')
        expect(res.status).toBe(200);
        await validateExercises(res.body);
    });

});

async function validateExercises(objs: any[]) {
    for (const obj of objs) {
        const doc = new Exercise(obj);
        await expect(doc.validate()).resolves.toBeUndefined();
    }
}