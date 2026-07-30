import { trpc } from "@/lib/trpc";

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export async function uploadDocumentToS3(
  file: File,
  dossierNumber: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Get presigned URL from server
    const presignedResponse = await fetch("/api/documents/presigned-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        dossierNumber,
      }),
    });

    if (!presignedResponse.ok) {
      throw new Error("Failed to get presigned URL");
    }

    const { url, key } = await presignedResponse.json();

    // Upload file to S3 using presigned URL
    const uploadResponse = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload file to S3");
    }

    // Notify server that upload is complete
    const completeResponse = await fetch("/api/documents/upload-complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        dossierNumber,
      }),
    });

    if (!completeResponse.ok) {
      throw new Error("Failed to complete upload");
    }

    const result = await completeResponse.json();

    return {
      success: true,
      url: result.url,
    };
  } catch (error) {
    console.error("Document upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function deleteDocument(
  documentId: string,
  dossierNumber: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("/api/documents/delete", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        documentId,
        dossierNumber,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to delete document");
    }

    return { success: true };
  } catch (error) {
    console.error("Document deletion error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getDocuments(dossierNumber: string) {
  try {
    const response = await fetch(
      `/api/documents/list?dossierNumber=${encodeURIComponent(dossierNumber)}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch documents");
    }

    return await response.json();
  } catch (error) {
    console.error("Get documents error:", error);
    return { success: false, documents: [] };
  }
}
