import {
  MEDIA_FILE_SECTIONS,
  MEDIA_FILE_SECTION_LABELS,
} from './constants';

export const FILE_SECTION_KEYS = MEDIA_FILE_SECTIONS.map(
  (section) => section.key
);

export const FILE_SECTION_LABELS = MEDIA_FILE_SECTION_LABELS;

export const sanitizeFileName = (name = '') =>
  String(name || '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '');

export const buildProjectFileStoragePath = ({
  projectId,
  sectionKey,
  originalName,
}) => {
  const safeName = sanitizeFileName(originalName || 'file');
  const stamp = Date.now();
  return `projects/${projectId}/project-files/${sectionKey}/${stamp}-${safeName}`;
};

export const getProjectFileExtension = (name = '') => {
  const parts = String(name || '').split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
};

export const getProjectFileKind = (name = '', contentType = '') => {
  const ext = getProjectFileExtension(name);
  const mime = String(contentType || '').toLowerCase();

  if (
    mime.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)
  ) {
    return 'image';
  }

  if (
    mime.startsWith('video/') ||
    ['mp4', 'mov', 'webm', 'm4v'].includes(ext)
  ) {
    return 'video';
  }

  if (
    mime.startsWith('audio/') ||
    ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(ext)
  ) {
    return 'audio';
  }

  if (mime.includes('pdf') || ext === 'pdf') {
    return 'pdf';
  }

  return 'document';
};

export const getProjectFileUrl = (file = {}) =>
  file?.url ||
  file?.downloadURL ||
  file?.downloadUrl ||
  file?.fileUrl ||
  file?.src ||
  file?.previewUrl ||
  '';

export const normalizeProjectFileRecord = (
  file = {},
  fallbackSection = 'other'
) => {
  const fileName =
    file?.name || file?.fileName || file?.originalFileName || 'Untitled file';

  const url = getProjectFileUrl(file);

  return {
    id:
      file?.id ||
      `file_${fallbackSection}_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 8)}`,
    name: fileName,
    fileName,
    displayName: file?.displayName || file?.portalName || fileName,
    originalFileName: file?.originalFileName || fileName,
    section:
      file?.section || file?.category || file?.subCategory || fallbackSection,
    category:
      file?.category || file?.section || file?.subCategory || fallbackSection,
    subCategory:
      file?.subCategory || file?.section || file?.category || fallbackSection,
    sortOrder: Number.isFinite(file?.sortOrder) ? file.sortOrder : 0,
    hiddenFromCustomer:
      typeof file?.hiddenFromCustomer === 'boolean'
        ? file.hiddenFromCustomer
        : !!file?.hidden,
    hidden:
      typeof file?.hidden === 'boolean'
        ? file.hidden
        : !!file?.hiddenFromCustomer,
    url,
    downloadURL: url,
    thumbnailUrl: file?.thumbnailUrl || url,
    contentType: file?.contentType || file?.mimeType || '',
    size: Number(file?.size || 0),
    kind: file?.kind || getProjectFileKind(fileName, file?.contentType || ''),
    storagePath: file?.storagePath || '',
    uploadedAt: file?.uploadedAt || new Date().toISOString(),
    uploadedBy: file?.uploadedBy || 'admin',
  };
};

export const syncAttachmentsFromProjectFiles = (projectFiles = []) => {
  const grouped = {};

  MEDIA_FILE_SECTIONS.forEach((section) => {
    grouped[section.key] = [];
  });

  (projectFiles || []).forEach((file) => {
    const normalized = normalizeProjectFileRecord(file);
    const sectionKey =
      normalized.section ||
      normalized.category ||
      normalized.subCategory ||
      'other';

    if (!grouped[sectionKey]) grouped[sectionKey] = [];

    grouped[sectionKey].push({
      id: normalized.id,
      title: normalized.displayName || normalized.name,
      name: normalized.name,
      displayName: normalized.displayName || normalized.name,
      fileName: normalized.fileName,
      originalFileName: normalized.originalFileName,
      url: normalized.url,
      downloadURL: normalized.downloadURL,
      thumbnailUrl: normalized.thumbnailUrl,
      contentType: normalized.contentType,
      mimeType: normalized.contentType,
      size: normalized.size,
      kind: normalized.kind,
      hidden: normalized.hidden,
      hiddenFromCustomer: normalized.hiddenFromCustomer,
      category: sectionKey,
      section: sectionKey,
      subCategory: sectionKey,
      sortOrder: normalized.sortOrder,
      storagePath: normalized.storagePath,
      uploadedAt: normalized.uploadedAt,
      createdAt: normalized.uploadedAt,
      uploadedBy: normalized.uploadedBy,
    });
  });

  Object.keys(grouped).forEach((sectionKey) => {
    grouped[sectionKey] = grouped[sectionKey].sort(
      (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)
    );
  });

  return grouped;
};

export const normalizeSortOrdersForSection = (
  projectFiles = [],
  sectionKey
) => {
  const sectionFiles = projectFiles
    .filter((file) => {
      const section =
        file?.section || file?.category || file?.subCategory || 'other';
      return section === sectionKey;
    })
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map((file, index) => ({
      ...file,
      section: sectionKey,
      category: sectionKey,
      subCategory: sectionKey,
      sortOrder: index,
    }));

  const otherFiles = projectFiles.filter((file) => {
    const section =
      file?.section || file?.category || file?.subCategory || 'other';
    return section !== sectionKey;
  });

  return [...otherFiles, ...sectionFiles];
};

export const getProjectFilesFromSources = ({
  editableData = {},
  projectData = {},
}) => {
  const flatFiles = Array.isArray(editableData?.projectFiles)
    ? editableData.projectFiles
    : Array.isArray(projectData?.projectFiles)
      ? projectData.projectFiles
      : Array.isArray(editableData?.files)
        ? editableData.files
        : Array.isArray(projectData?.files)
          ? projectData.files
          : [];

  const attachmentsSource =
    editableData?.attachments && typeof editableData.attachments === 'object'
      ? editableData.attachments
      : projectData?.attachments && typeof projectData.attachments === 'object'
        ? projectData.attachments
        : {};

  const attachmentFiles = Object.entries(attachmentsSource).flatMap(
    ([sectionKey, arr]) => {
      if (!Array.isArray(arr)) return [];
      return arr.map((file) => normalizeProjectFileRecord(file, sectionKey));
    }
  );

  const normalizedFlatFiles = flatFiles.map((file) =>
    normalizeProjectFileRecord(file)
  );

  const byId = new Map();

  [...normalizedFlatFiles, ...attachmentFiles].forEach((file) => {
    const key =
      file?.id ||
      `${file?.section || 'other'}::${file?.name || ''}::${file?.storagePath || ''}`;

    const existing = byId.get(key);

    if (!existing) {
      byId.set(key, file);
      return;
    }

    byId.set(key, {
      ...existing,
      ...file,
      url: getProjectFileUrl(file) || getProjectFileUrl(existing) || '',
      downloadURL:
        file?.downloadURL ||
        existing?.downloadURL ||
        getProjectFileUrl(file) ||
        getProjectFileUrl(existing) ||
        '',
      storagePath: file?.storagePath || existing?.storagePath || '',
      contentType: file?.contentType || existing?.contentType || '',
      kind: file?.kind || existing?.kind || '',
      section: file?.section || existing?.section || 'other',
      category: file?.category || existing?.category || 'other',
      subCategory: file?.subCategory || existing?.subCategory || 'other',
    });
  });

  return Array.from(byId.values());
};