/**
 * Quotation PDF Export Button Component
 * Provides UI for generating and downloading quotation PDFs
 */

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { generateQuotationPDF, getQuotationPDFBlob } from '@/services/quotationPDFService';
import type { Quotation, QuotationItem } from '@/types';
import { useToastStore } from '@/store/toastStore';

interface QuotationPDFExportProps {
  quotation: Quotation & { items?: QuotationItem[] };
  variant?: 'button' | 'icon';
  showPreview?: boolean;
  className?: string;
}

export function QuotationPDFExport({
  quotation,
  variant = 'button',
  showPreview = true,
  className = '',
}: QuotationPDFExportProps) {
  const [loading, setLoading] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { success, error } = useToastStore();

  const handleGeneratePDF = async (action: 'download' | 'preview' = 'download') => {
    try {
      setLoading(true);

      if (action === 'preview' && showPreview) {
        const blob = await getQuotationPDFBlob(quotation);
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setShowPreviewModal(true);
        success('PDF preview generated');
      } else {
        await generateQuotationPDF(quotation);
        success('Quotation PDF downloaded successfully');
      }
    } catch (err) {
      console.error('Error generating PDF:', err);
      error('Failed to generate PDF');
    } finally {
      setLoading(false);
    }
  };

  if (variant === 'icon') {
    return (
      <>
        <button
          onClick={() => handleGeneratePDF('download')}
          disabled={loading}
          className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
          title="Download PDF"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
        </button>
        {showPreviewModal && previewUrl && (
          <PDFPreviewModal
            previewUrl={previewUrl}
            onClose={() => {
              setShowPreviewModal(false);
              URL.revokeObjectURL(previewUrl);
              setPreviewUrl(null);
            }}
            onDownload={() => handleGeneratePDF('download')}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className={`flex items-center space-x-2 ${className}`}>
        <button
          onClick={() => handleGeneratePDF('download')}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </>
          )}
        </button>

        {showPreview && (
          <button
            onClick={() => handleGeneratePDF('preview')}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Previewing...
              </>
            ) : (
              <>
                Preview
              </>
            )}
          </button>
        )}
      </div>

      {showPreviewModal && previewUrl && (
        <PDFPreviewModal
          previewUrl={previewUrl}
          onClose={() => {
            setShowPreviewModal(false);
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
          }}
          onDownload={() => handleGeneratePDF('download')}
        />
      )}
    </>
  );
}

/**
 * PDF Preview Modal Component
 */
interface PDFPreviewModalProps {
  previewUrl: string;
  onClose: () => void;
  onDownload: () => void;
}

function PDFPreviewModal({ previewUrl, onClose, onDownload }: PDFPreviewModalProps) {
  const [scale, setScale] = useState(1);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">Quotation Preview</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-b space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setScale(Math.max(0.5, scale - 0.1))}
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
            >
              −
            </button>
            <span className="text-sm font-medium w-12 text-center">{Math.round(scale * 100)}%</span>
            <button
              onClick={() => setScale(Math.min(2, scale + 0.1))}
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
            >
              +
            </button>
          </div>

          <button
            onClick={onDownload}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
          >
            <Download className="w-4 h-4 inline mr-2" />
            Download
          </button>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          <div className="flex justify-center">
            <iframe
              src={previewUrl}
              className="bg-white shadow-lg"
              style={{
                width: `${scale * 800}px`,
                height: `${scale * 1131}px`,
              }}
              title="PDF Preview"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuotationPDFExport;
