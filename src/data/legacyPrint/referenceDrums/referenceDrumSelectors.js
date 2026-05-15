// src/data/legacyPrint/referenceDrums/referenceDrumSelectors.js

import { referenceDrumDataset } from './generated/referenceDrumDataset';

const unique = (items = []) => {

  return Array.from(new Set(items.filter(Boolean)));

};

const isGenericBaseline = (companyType = '') => {

  return companyType === 'Generic / Baseline Reference';

};

export const getReferenceDrumRecords = () => {

  return referenceDrumDataset;

};

export const getReferenceCompanyTypes = () => {

  return unique(referenceDrumDataset.map((record) => record.companyType));

};

export const getReferenceCompaniesByType = (companyType) => {

  if (isGenericBaseline(companyType)) {

    return [];

  }

  return unique(

    referenceDrumDataset

      .filter((record) => record.companyType === companyType)

      .map((record) => record.companyName)

  );

};

export const getReferenceLines = ({ companyType, companyName = '' }) => {

  return unique(

    referenceDrumDataset

      .filter((record) => {

        if (record.companyType !== companyType) return false;

        if (!isGenericBaseline(companyType) && companyName) {

          return record.companyName === companyName;

        }

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

    referenceDrumDataset

      .filter((record) => {

        if (record.companyType !== companyType) return false;

        if (!isGenericBaseline(companyType) && companyName) {

          if (record.companyName !== companyName) return false;

        }

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

  return referenceDrumDataset.find((record) => {

    if (record.companyType !== companyType) return false;

    if (!isGenericBaseline(companyType) && companyName) {

      if (record.companyName !== companyName) return false;

    }

    if (lineName && record.lineName !== lineName) return false;

    if (modelName && record.modelName !== modelName) return false;

    if (drumType && record.drumType !== drumType) return false;

    return true;

  });

};

export const getReferenceSizes = (params) => {

  return getReferenceRecord(params)?.sizes || [];

};

export const getReferenceRecordForSelector = (selector = {}) => {

  return getReferenceRecord({

    companyType: selector.nonOberCompanyType,

    companyName: selector.nonOberCompanyName,

    lineName: selector.nonOberLineName,

    modelName: selector.nonOberModelName,

    drumType: selector.drumType,

  });

};