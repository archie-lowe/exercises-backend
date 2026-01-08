import express from 'express';
import * as exercisesController from './controller.js'

const exercisesRouter = express.Router();
exercisesRouter.get('/', exercisesController.fetchExercises);
exercisesRouter.get('/:id', exercisesController.fetchExercise);
exercisesRouter.post('/', exercisesController.createExercise);
exercisesRouter.put('/:id', exercisesController.updateExercise);
exercisesRouter.delete('/:id', exercisesController.deleteExercise);

export default exercisesRouter