// src/data/legacyPrint/referenceDrums/referenceDrumSelectors.js

import { referenceDrumSeed } from './referenceDrumSeed';

const unique = (items = []) => {

  return Array.from(new Set(items.filter(Boolean)));

};

export const getReferenceDrumRecords = () => {

  return referenceDrumSeed;

};

export const getReferenceCompanyTypes = () => {

  return unique(referenceDrumSeed.map((record) => record.companyType));

};

export const getReferenceCompaniesByType = (companyType) => {

  return unique(

    referenceDrumSeed

      .filter((record) => record.companyType === companyType)

      .map((record) => record.companyName)

  );

};

export const getReferenceLines = ({ companyType, companyName = '' }) => {

  return unique(

    referenceDrumSeed

      .filter((record) => {

        if (record.companyType !== companyType) return false;

        if (companyName && record.companyName !== companyName) return false;

        return true;

      })

      .map((record) => record.lineName)

  );

};

export const getReferenceModels = ({

  companyType,

  companyName = '',

  lineName = '',

  drumType = '',

}) => {

  return unique(

    referenceDrumSeed

      .filter((record) => {

        if (record.companyType !== companyType) return false;

        if (companyName && record.companyName !== companyName) return false;

        if (lineName && record.lineName !== lineName) return false;

        if (drumType && record.drumType !== drumType) return false;

        return true;

      })

      .map((record) => record.modelName)

  );

};

export const getReferenceRecord = ({

  companyType,

  companyName = '',

  lineName = '',

  modelName = '',

  drumType = '',

}) => {

  return referenceDrumSeed.find((record) => {

    if (record.companyType !== companyType) return false;

    if (companyName && record.companyName !== companyName) return false;

    if (lineName && record.lineName !== lineName) return false;

    if (modelName && record.modelName !== modelName) return false;

    if (drumType && record.drumType !== drumType) return false;

    return true;

  });

};

export const getReferenceSizes = (params) => {

  return getReferenceRecord(params)?.sizes || [];

};