import React, { useState, useEffect } from "react";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  listAll,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import "./FileUploader.css";

const FileUploader = ({ projectId }) => {
  const [files, setFiles] = useState({});
  const [uploads, setUploads] = useState({});
  const storage = getStorage();

  const categories = [
    "Intro Call Notes",
    "Sales Agreement",
    "Audio Files",
    "Image Gallery",
    "Other",
  ];

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const fetchedFiles = {};
        for (const category of categories) {
          const categoryRef = ref(storage, `projects/${projectId}/${category}`);
          const res = await listAll(categoryRef);
          fetchedFiles[category] = await Promise.all(
            res.items.map(async (itemRef) => ({
              name: itemRef.name,
              url: await getDownloadURL(itemRef),
              ref: itemRef, // Keep the file reference for deletion
            }))
          );
        }
        setFiles(fetchedFiles);
      } catch (error) {
        console.error("Error fetching files:", error);
      }
    };

    fetchFiles();
  }, [projectId]);

  const handleFileUpload = (category, file) => {
    const fileRef = ref(storage, `projects/${projectId}/${category}/${file.name}`);
    const uploadTask = uploadBytesResumable(fileRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploads((prev) => ({
          ...prev,
          [file.name]: { progress, category },
        }));
      },
      (error) => console.error("Upload error:", error),
      async () => {
        const url = await getDownloadURL(fileRef);
        setFiles((prev) => ({
          ...prev,
          [category]: [
            ...(prev[category] || []),
            { name: file.name, url, ref: fileRef },
          ],
        }));
      }
    );
  };

  const handleDragDrop = (e, category) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleFileUpload(category, file);
  };

  const handleFileDelete = async (category, file) => {
    if (window.confirm(`Delete "${file.name}"?`)) {
      try {
        await deleteObject(file.ref); // Delete from Firebase Storage
        setFiles((prev) => ({
          ...prev,
          [category]: prev[category].filter((f) => f.name !== file.name), // Remove from UI
        }));
        // console.log(`${file.name} deleted successfully.`);
      } catch (error) {
        console.error(`Error deleting ${file.name}:`, error);
      }
    }
  };

  return (
    <div className="file-uploader">
      <h3>Project Attachments</h3>
      <div className="attachments-grid">
        {categories.slice(0, 3).map((category) => (
          <div key={category} className="file-category">
            <h4>{category}</h4>
            <div
              className="upload-zone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDragDrop(e, category)}
            >
              Drag & Drop or{" "}
              <label>
                <input
                  type="file"
                  onChange={(e) => handleFileUpload(category, e.target.files[0])}
                />
                <span>Upload</span>
              </label>
            </div>
            <div className="file-preview-container">
              {files[category]?.map((file) => (
                <div key={file.name} className="file-preview" title={file.name}>
                  {category === "Image Gallery" ? (
                    <img src={file.url} alt={file.name} className="file-thumbnail" />
                  ) : (
                    <a href={file.url} target="_blank" rel="noopener noreferrer">
                      <div className="file-icon">📄</div>
                    </a>
                  )}
                  <p className="file-name">{file.name}</p>
                  <button
                    className="delete-button"
                    onClick={() => handleFileDelete(category, file)}
                  >
                    🗑 Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="file-category file-category-expanded">
          <h4>Image Gallery</h4>
          <div
            className="upload-zone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDragDrop(e, "Image Gallery")}
          >
            Drag & Drop or{" "}
            <label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload("Image Gallery", e.target.files[0])}
              />
              <span>Upload</span>
            </label>
          </div>
          <div className="file-preview-container">
            {files["Image Gallery"]?.map((file) => (
              <div key={file.name} className="file-preview">
                <img src={file.url} alt={file.name} className="file-thumbnail" />
                <p className="file-name">{file.name}</p>
                <button
                  className="delete-button"
                  onClick={() => handleFileDelete("Image Gallery", file)}
                >
                  🗑 Delete
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="file-category file-category-expanded">
          <h4>Other</h4>
          <div
            className="upload-zone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDragDrop(e, "Other")}
          >
            Drag & Drop or{" "}
            <label>
              <input
                type="file"
                onChange={(e) => handleFileUpload("Other", e.target.files[0])}
              />
              <span>Upload</span>
            </label>
          </div>
          <div className="file-preview-container">
            {files["Other"]?.map((file) => (
              <div key={file.name} className="file-preview" title={file.name}>
                <a href={file.url} target="_blank" rel="noopener noreferrer">
                  <div className="file-icon">📄</div>
                </a>
                <p className="file-name">{file.name}</p>
                <button
                  className="delete-button"
                  onClick={() => handleFileDelete("Other", file)}
                >
                  🗑 Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUploader;