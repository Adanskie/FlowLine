/**
 * Download a file attachment through the authenticated axios instance.
 * Uses responseType "blob" so the Bearer token is sent with the request.
 *
 * @param {import('axios').AxiosInstance} api        - The configured axios instance
 * @param {number}   attachmentId  - attachment_id of the file
 * @param {string}   fileName      - original file name used for the download prompt
 * @param {function} onError       - called with an error string if the download fails
 */
const downloadFile = async (api, attachmentId, fileName, onError) => {
  try {
    const response = await api.get(`/files/${attachmentId}/download`, {
      responseType: 'blob',
    });

    const url  = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href  = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    // The error response is a Blob because responseType is 'blob'.
    // Parse it back to JSON to extract the error message.
    let message = 'Download failed.';
    if (err.response?.data instanceof Blob) {
      try {
        const text = await err.response.data.text();
        const json = JSON.parse(text);
        if (json?.error) message = json.error;
      } catch {
        // leave default message
      }
    } else if (err.response?.data?.error) {
      message = err.response.data.error;
    }
    onError(message);
  }
};

export default downloadFile;
