import isEqual from 'lodash.isequal';
import { Exercise } from './models.js'
import type { ExerciseDoc } from './models.js'

export async function findAndRank(keywords: string[]): Promise<ExerciseDoc[]> {
    const ranking: Map<ExerciseDoc, number> = new Map();
    for (const word of keywords) {
        const regex = new RegExp(`\\b${word}`, 'i'); // Matches the start of a word
        const matches = await Exercise.find({
            $or:[
                {name: regex},
                {bp: regex}]
            });
        matches.forEach(match => {
            // lodash.isequal to find using value-based match. Reference based match (.has) won't work (two different obj)
            const exercise = Array.from(ranking.keys()).find(exercise => isEqual(exercise, match));
            if (exercise) {
                ranking.set(exercise, ranking.get(exercise)! + 1)
            } else {
                ranking.set(match, 1);
            }
        });
    }
    
    return Array.from(ranking.entries())
        .sort((a, b) => b[1] - a[1]) // descending by value
        .map((entry) => entry[0]); // get the key
}