export const modifierReferenceSchema = {

  id: 'string',

  schemaVersion: 'string',

  modifierType: 'string',

  brand: 'string',

  modelName: 'string',

  modelNumber: 'string',

  physicalProperties: {

    material: 'string',

    thickness: 'number',

    plyCount: 'number',

    strandCount: 'number',

    weightClass: 'string'

  },

  acousticProfile: {

    attack: 'number',

    brightness: 'number',

    projection: 'number',

    sustain: 'number',

    warmth: 'number',

    sensitivity: 'number',

    control: 'number'

  },

  sourceIds: ['string'],

  sourceConfidence: 'string',

  notes: 'string',

  createdAt: 'timestamp',

  updatedAt: 'timestamp'

};