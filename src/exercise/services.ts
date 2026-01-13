import isEqual from 'lodash.isequal';
import { Exercise } from './models.js'
import type { ExerciseDoc } from './models.js'

export async function findAndRank(keywords: string[]): Promise<ExerciseDoc[]> {
    const ranking: Map<string, { doc: ExerciseDoc, count: number }> = new Map();
    
    for (const word of keywords) {
        const regex = new RegExp(`\\b${word}`, 'i'); // Matches the start of a word
        const matches = await Exercise.find({
            $or:[
                {name: regex},
                {bp: regex}
            ]
        });
        
        matches.forEach(match => {
            const id = match._id.toString(); // Use string ID as key instead of object comparison
            
            if (ranking.has(id)) {
                ranking.get(id)!.count += 1;
            } else {
                ranking.set(id, { doc: match, count: 1 });
            }
        });
    }
    
    return Array.from(ranking.values())
        .sort((a, b) => b.count - a.count) // descending by count
        .map((entry) => entry.doc); // get the document
}