import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../../src/app.js';
import { Exercise, exerciseSchema } from '../../src/exercise/models.js';

describe('Exercises Backend', () => {
    let mongoServer: MongoMemoryServer;
    let ids: String[];

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
        const exercises = await Exercise.create([
            { name: 'shoulder',  desc: 'testing testing shoulder', tutorial: 'helpful tutorial', bp: 'shoulders'},
            { name: 'arms',  desc: 'testing testing arms', tutorial: 'helpful tutorial', bp: 'arms'},
            { name: 'chest',  desc: 'testing testing chest', tutorial: 'helpful tutorial', bp: 'chest'}
        ])
        ids = exercises.map(e => e._id.toString())
    })

    afterEach(async () => {
        // Clear data after each test
        await Exercise.deleteMany({})
    });

    describe('GET exercises', () => {
        it('should return exercises with search query', async () => {
            const res = await request(app).get('/v1/exercises?q=chest');
            expect(res.status).toBe(200);
            await validateExercises(res.body);
        });
    
        // UPDATED: Return all exercises when query parameter is missing
        it('should return all exercises when query parameter is missing', async () => {
            const res = await request(app).get('/v1/exercises');
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(3); // Should return all 3 exercises from beforeEach
            await validateExercises(res.body);
        });
    
        // UPDATED: Return all exercises when query parameter is empty
        it('should return all exercises when query parameter is empty', async () => {
            const res = await request(app).get('/v1/exercises?q=');
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(3);
            await validateExercises(res.body);
        });
    
        // Test no results found
        it('should return 404 when no exercises match query', async () => {
            const res = await request(app).get('/v1/exercises?q=nonexistent');
            expect(res.status).toBe(404);
            expect(res.body.error).toBe('Bad Request');
        });
    });
    
    describe('GET exercise', () => {
        it('should return exercise', async () => {
            const id = ids[0];
            const res = await request(app).get(`/v1/exercises/${id}`);
            expect(res.status).toBe(200);
            await validateExercise(res.body);
        });

        // NEW: Test invalid MongoDB ID format
        it('should return 400 for invalid MongoDB ID format', async () => {
            const invalidId = 'not-a-valid-id';
            const res = await request(app).get(`/v1/exercises/${invalidId}`);
            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Bad Request');
            expect(res.body.error_description).toBe('Invalid MongoDB ID');
        });

        it('should return 404 for non-existent exercise', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const res = await request(app).get(`/v1/exercises/${fakeId}`);
            expect(res.status).toBe(404);
            expect(res.body.error).toBe('Not Found');
        });
    });

    describe('POST exercise', () => {
        it('should create a new exercise', async () => {
            const newExercise = {
                name: "Bench Press",
                desc: "Chest exercise",
                tutorial: "helpful tutorial",
                bp: "chest"
            };
    
            const res = await request(app)
                .post('/v1/exercises')
                .send(newExercise)
                .set('Content-Type', 'application/json');
            
            expect(res.status).toBe(201);
            await validateExercise(res.body);
        });

        // NEW: Test validation error (missing required fields)
        it('should return 400 for missing required fields', async () => {
            const invalidExercise = {
                name: "Incomplete Exercise"
                // Missing: desc, tutorial, bp
            };

            const res = await request(app)
                .post('/v1/exercises')
                .send(invalidExercise);

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Bad Request');
        });

        // NEW: Test validation error (invalid field value)
        it('should return 400 for invalid field values', async () => {
            const invalidExercise = {
                name: "Invalid Exercise",
                desc: "Test",
                tutorial: "Test",
                bp: "InvalidBodyPart" // Not in enum
            };

            const res = await request(app)
                .post('/v1/exercises')
                .send(invalidExercise);

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Bad Request');
        });

        // NEW: Test duplicate name (409 Conflict)
        it('should return 409 when exercise name already exists', async () => {
            const exercise = {
                name: "Duplicate Exercise",
                desc: "Test",
                tutorial: "Test",
                bp: "chest"
            };

            // Create first exercise
            await request(app).post('/v1/exercises').send(exercise);

            // Try to create duplicate
            const res = await request(app).post('/v1/exercises').send(exercise);

            expect(res.status).toBe(409);
            expect(res.body.error).toBe('Conflict');
            expect(res.body.error_description).toBe('An exercise with this name already exists');
        });
    });

    describe('PUT exercise', () => {
        it('should update an existing exercise', async () => {
            const existingId = ids[0];
            const updatedExercise = {
                name: "Barbell Bench Press",
                desc: "Updated chest exercise description",
            };
    
            const res = await request(app)
                .put(`/v1/exercises/${existingId}`)
                .send(updatedExercise)
                .set('Content-Type', 'application/json');
    
            expect(res.status).toBe(200);
            expect(res.body.name).toBe(updatedExercise.name);
            expect(res.body._id).toBe(existingId);
            expect(res.body.desc).toBe(updatedExercise.desc);
            await validateExercise(res.body);
        });

        // NEW: Test invalid MongoDB ID format
        it('should return 400 for invalid MongoDB ID format', async () => {
            const invalidId = 'invalid-id-format';
            const updatedExercise = {
                name: "Test",
                desc: "Test",
                tutorial: "Test",
                bp: "chest"
            };

            const res = await request(app)
                .put(`/v1/exercises/${invalidId}`)
                .send(updatedExercise);

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Bad Request');
            expect(res.body.error_description).toBe('Invalid MongoDB ID');
        });
    
        it('should return 404 for non-existent exercise', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const updatedExercise = {
                name: "Test",
                desc: "Test",
                tutorial: "Test",
                bp: "chest"
            };
    
            const res = await request(app)
                .put(`/v1/exercises/${fakeId}`)
                .send(updatedExercise);
    
            expect(res.status).toBe(404);
            expect(res.body.error).toBe('Not Found');
        });

        // NEW: Test validation error during update
        it('should return 400 for invalid update data', async () => {
            const existingId = ids[0];
            const invalidUpdate = {
                bp: "InvalidBodyPart" // Invalid enum value
            };

            const res = await request(app)
                .put(`/v1/exercises/${existingId}`)
                .send(invalidUpdate);

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Bad Request');
        });

        // NEW: Test duplicate name on update (409 Conflict)
        it('should return 409 when updating to duplicate name', async () => {
            const firstId = ids[0];
            const secondId = ids[1];

            // Try to update second exercise to have same name as first
            const res = await request(app)
                .put(`/v1/exercises/${secondId}`)
                .send({ name: "shoulder" }); // Name from ids[0]

            expect(res.status).toBe(409);
            expect(res.body.error).toBe('An exercise with this name already exists');
        });
    });

    describe('DELETE exercise', () => {
        it('should delete an existing exercise', async () => {
            const exerciseToDelete = {
                name: "Temporary Exercise",
                desc: "Will be deleted",
                tutorial: "test",
                bp: "chest"
            };
    
            const createRes = await request(app)
                .post('/v1/exercises')
                .send(exerciseToDelete);
            
            const idToDelete = createRes.body._id;
    
            const deleteRes = await request(app)
                .delete(`/v1/exercises/${idToDelete}`);
    
            expect(deleteRes.status).toBe(200);
    
            const getRes = await request(app).get(`/v1/exercises/${idToDelete}`);
            expect(getRes.status).toBe(404);
        });

        // NEW: Test invalid MongoDB ID format
        it('should return 400 for invalid MongoDB ID format', async () => {
            const invalidId = 'not-valid-mongodb-id';

            const res = await request(app)
                .delete(`/v1/exercises/${invalidId}`);

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Bad Request');
            expect(res.body.error_description).toBe('Invalid MongoDB ID');
        });
    
        it('should return 404 when deleting non-existent exercise', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
    
            const res = await request(app)
                .delete(`/v1/exercises/${fakeId}`);
    
            expect(res.status).toBe(404);
            expect(res.body.error).toBe('Not Found');
        });
    
        it('should not allow deleting same exercise twice', async () => {
            const createRes = await request(app)
                .post('/v1/exercises')
                .send({
                    name: "Temp Exercise 2",
                    desc: "test",
                    tutorial: "test",
                    bp: "chest"
                });
            
            const id = createRes.body._id;
            
            const firstDelete = await request(app).delete(`/v1/exercises/${id}`);
            expect(firstDelete.status).toBe(200);
    
            const secondDelete = await request(app).delete(`/v1/exercises/${id}`);
            expect(secondDelete.status).toBe(404);
        });
    });
});

async function validateExercises(objs: any[]) {
    for (const obj of objs) {
        await validateExercise(obj)
    }
}

async function validateExercise(obj: any) {
    const doc = new Exercise(obj);
    await expect(doc.validate()).resolves.toBeUndefined();
}