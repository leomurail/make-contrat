import type { DocTemplate } from '../lib/types'
import { contratCession } from './cession-droits-auteur'

/** Modèles de contrats disponibles dans Make Contrat. */
export const templates = [contratCession] as unknown as DocTemplate[]
