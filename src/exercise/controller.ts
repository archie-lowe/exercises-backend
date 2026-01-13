import type { Request, Response } from 'express';
import { Exercise } from './models.js'
import mongoose from 'mongoose';
import { MongoServerError } from 'mongodb';
import { findAndRank } from './services.js';

export async function fetchExercises(req: Request, res: Response) {
    try {
        let { q } = req.query;

        const keywords = !q ? [''] : q.toString().trim().split(' ')
        const ranked = await findAndRank(keywords);

        if (!ranked.length) {
            return res.status(404).json({
                error: 'Bad Request',
                error_description: 'Exercise not found'
            });
        }

        res.json(Array.from(ranked));

    } catch (err: any) {
        res.status(500).json({
            error: 'Internal Server Error',
            error_description: err.message
        });
    }
}

export async function fetchExercise(req: Request, res: Response) {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                error: 'Bad Request',
                error_description: "Missing request parameter ID"
            })
        } 
        else if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                error: 'Bad Request',
                error_description: 'Invalid MongoDB ID'
            })
        }

    
        const exercise = await Exercise.findById(id)

        if (!exercise) {
            return res.status(404).json({
                error: 'Not Found',
                error_description: 'Exercise not found'
            })
        }

        res.status(200).json(exercise)
    } catch (err: any) {
        res.status(500).json({
            error: 'Internal Server Error',
            error_description: err.message
        })
    }
}

export async function createExercise(req: Request, res: Response) {
    try {
        const data = req.body;
        const exercise = await Exercise.create(data);
        res.status(201).json(exercise)
    } catch (err: any) {  
        if (err instanceof mongoose.Error) { // BadRequest
            res.status(400).json({
                error: 'Bad Request',
                error_description: err.message
            })
        }
        if (err instanceof MongoServerError && err.code === 11000) { // DuplicateKey
            res.status(409).json({
                error: 'Conflict',
                error_description: 'An exercise with this name already exists'
            })
        }
        else {
            res.status(500).json({ // InternalServerError
                error: 'Internal Server Error',
                error_description: err.message
            })
        }
    }
}

export async function updateExercise(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const data = req.body;

        if (!id) {
            return res.status(400).json({
                error: 'Bad Request',
                error_description: "Missing request parameter ID"
            })
        } 
        else if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                error: 'Bad Request',
                error_description: 'Invalid MongoDB ID'
            })
        }

        const exercise = await Exercise.findByIdAndUpdate(id, data, {
            new: true, // Return the modified document
            runValidators: true // Validate the update operation against the model's schema
        })

        if (!exercise) {
            return res.status(404).json({
                error: 'Not Found',
                error_description: 'Exercise not found'
            })
        }

        res.status(200).json(exercise)
    } catch (err: any) {
        if (err instanceof mongoose.Error) { // BadRequest
            res.status(400).json({
                error: 'Bad Request',
                error_description: err.message
            })
        }
        if (err instanceof MongoServerError && err.code === 11000) { // DuplicateKey
            res.status(409).json({
                error: 'An exercise with this name already exists',
                error_description: err.message
            })
        }
        else {
            res.status(500).json({ // InternalServerError
                error: 'Internal Server Error',
                error_description: err.message
            })
        }
    }
}

export async function deleteExercise(req: Request, res: Response) {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                error: 'Bad Request',
                error_description: "Missing request parameter ID"
            })
        } 
        else if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                error: 'Bad Request',
                error_description: 'Invalid MongoDB ID'
            })
        }

        const exercise = await Exercise.findByIdAndDelete(id)

        if (!exercise) {
            return res.status(404).json({
                error: 'Not Found',
                error_description: 'Exercise not found'
            })
        }

        res.status(200).json(exercise)
    } catch (err: any) {
        if (err instanceof mongoose.Error) { // BadRequest
            res.status(400).json({
                error: 'Bad Request',
                error_description: err.message
            })
        }
        else {
            res.status(500).json({ // InternalServerError
                error: 'Internal Server Error',
                error_description: err.message
            })
        }
    }
}