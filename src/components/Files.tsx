import { useState, useRef, ChangeEvent } from 'react';
import { Upload, Download, FileText, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import { fileService } from '../services/file.service';
import { UploadFileResponse, ApiError } from '../types';

interface UploadedFile extends UploadFileResponse {
  uploadedAt: string;
}

export const Files = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [downloadHash, setDownloadHash] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsUploading(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      const response = await fileService.uploadFile(file);
      const uploadedFile: UploadedFile = {
        ...response,
        uploadedAt: new Date().toISOString(),
      };
      setUploadedFiles([uploadedFile, ...uploadedFiles]);
      setUploadSuccess(`File "${response.filename}" uploaded successfully!`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      const error = err as ApiError;
      setUploadError(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async () => {
    if (!downloadHash.trim()) return;

    setDownloadError('');
    try {
      const blob = await fileService.downloadFile(downloadHash.trim());
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `file-${downloadHash.slice(0, 8)}.bin`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setDownloadHash('');
    } catch (err) {
      const error = err as ApiError;
      setDownloadError(error.message);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">File Management</h1>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <FileText size={20} />
          <span>{uploadedFiles.length} files uploaded</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Upload className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Upload File to IPFS</h2>
          </div>

          {uploadSuccess && (
            <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg flex items-start gap-2">
              <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
              <span>{uploadSuccess}</span>
            </div>
          )}

          {uploadError && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg flex items-start gap-2">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <span>{uploadError}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select File to Upload
              </label>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50 disabled:opacity-50"
              />
            </div>

            {isUploading && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">Uploading to IPFS...</span>
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">About IPFS Upload</h3>
              <p className="text-sm text-blue-800 dark:text-blue-400">
                Files are uploaded to IPFS (InterPlanetary File System), a distributed file storage network. You'll receive
                a unique hash that can be used to retrieve the file later.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Download className="text-green-600 dark:text-green-400" size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Download File from IPFS</h2>
          </div>

          {downloadError && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg flex items-start gap-2">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <span>{downloadError}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">IPFS Hash</label>
              <input
                type="text"
                value={downloadHash}
                onChange={(e) => setDownloadHash(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter IPFS hash"
              />
            </div>

            <button
              onClick={handleDownload}
              disabled={!downloadHash.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={20} />
              Download File
            </button>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-green-900 dark:text-green-300 mb-2">About IPFS Download</h3>
              <p className="text-sm text-green-800 dark:text-green-400">
                Enter the IPFS hash of the file you want to download. The file will be retrieved from the distributed
                network and downloaded to your device.
              </p>
            </div>
          </div>
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recently Uploaded Files</h2>
          <div className="space-y-3">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                      <FileText className="text-blue-600 dark:text-blue-400" size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">{file.filename}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Size: {formatFileSize(file.size)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Uploaded: {new Date(file.uploadedAt).toLocaleString()}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded flex-1 truncate">
                          {file.ipfsHash}
                        </code>
                        <button
                          onClick={() => copyToClipboard(file.ipfsHash)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                          title="Copy hash"
                        >
                          <Copy size={16} className="text-gray-600 dark:text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setDownloadHash(file.ipfsHash);
                      handleDownload();
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm whitespace-nowrap"
                  >
                    <Download size={16} />
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
