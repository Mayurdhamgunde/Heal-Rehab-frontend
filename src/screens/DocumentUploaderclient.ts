/**
 * Direct-to-Azure upload for patient documents, with real upload progress.
 *
 * Replaces the old flow in patientview.tsx's handleDocumentUpload, which built
 * a FormData and POSTed the whole file through Express (api.post(`/upload-document/...`)).
 * That's the part that was slow/expensive for your 10MB+ files — the file went
 * client -> your server -> Azure instead of client -> Azure directly.
 *
 * Uses XMLHttpRequest instead of fetch() because fetch has no upload progress event.
 */

import api from "../utils/central"; // <-- point this at your existing axios instance

interface UploadUrlResponse {
  uploadUrl: string;
  blobUrl: string;
  blobName: string;
}

interface PatientDocumentUploadPayload {
  patientId: string;
  file: File;
  documentName: string;
  documentType: string;
  onProgress?: (percent: number) => void;
}

function putFileToAzure(
  url: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    xhr.setRequestHeader("x-ms-blob-type", "BlockBlob");
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Azure upload failed with status ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });
}

export async function uploadPatientDocumentDirect({
  patientId,
  file,
  documentName,
  documentType,
  onProgress,
}: PatientDocumentUploadPayload) {
  const fileExtension = file.name.split(".").pop() || "";

  // 1. Ask the server for a one-time upload URL — small, instant JSON call.
  const { uploadUrl, blobUrl, blobName }: UploadUrlResponse = await api
    .post(`/upload-document/url/${patientId}`, { fileExtension })
    .then((r) => r.data);

  // 2. Upload the file straight to Azure, with real progress. This is the
  //    request that used to go through your Express server.
  await putFileToAzure(uploadUrl, file, onProgress);

  // 3. Tell the server the upload finished — again just a small JSON payload,
  //    no file bytes.
  const { data } = await api.post(`/upload-document/confirm/${patientId}`, {
    blobName,
    blobUrl,
    document_name: documentName,
    document_type: documentType,
    file_size: file.size,
    file_extension: fileExtension,
  });

  return data.document;
}