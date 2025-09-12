import React, { useState } from 'react';
import { Button } from './ui/button';
import { WhatsAppService } from '../services/whatsappService';
import type { Bill, BillSummary, SplitCalculation } from '../types/bill';
import { Share2, Copy, MessageCircle, Check, X } from 'lucide-react';

interface WhatsAppShareProps {
  bill: Bill;
  summary: BillSummary;
  settlements: SplitCalculation[];
}

type ShareType = 'full' | 'settlement' | 'summary';

export const WhatsAppShare: React.FC<WhatsAppShareProps> = ({ 
  bill, 
  summary, 
  settlements 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ShareType>('full');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const generateMessage = (type: ShareType): string => {
    switch (type) {
      case 'full':
        return WhatsAppService.generateUserCalculationMessage(bill, summary, settlements);
      case 'settlement':
        return WhatsAppService.generateSettlementMessage(bill, settlements);
      case 'summary':
        return WhatsAppService.generateSummaryMessage(bill, summary);
      default:
        return '';
    }
  };

  const handleCopyToClipboard = async () => {
    const message = generateMessage(selectedType);
    const success = await WhatsAppService.copyToClipboard(message);
    
    if (success) {
      setCopyStatus('success');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } else {
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  const handleOpenWhatsApp = () => {
    const message = generateMessage(selectedType);
    const whatsappURL = WhatsAppService.generateWhatsAppURL(message);
    window.open(whatsappURL, '_blank');
  };

  const getTypeDescription = (type: ShareType): string => {
    switch (type) {
      case 'full':
        return 'Pesan lengkap dengan perhitungan detail per user, menu items, dan settlements';
      case 'settlement':
        return 'Pesan singkat hanya berisi pembayaran yang diperlukan';
      case 'summary':
        return 'Ringkasan balance per user tanpa detail menu';
      default:
        return '';
    }
  };

  const getTypeIcon = (type: ShareType) => {
    switch (type) {
      case 'full':
        return '📊';
      case 'settlement':
        return '💸';
      case 'summary':
        return '💰';
      default:
        return '📱';
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 border-gray-300 hover:bg-gray-50"
      >
        <Share2 className="w-4 h-4" />
        <span>Share via WhatsApp</span>
      </Button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Share via WhatsApp</h3>
                    <p className="text-sm text-gray-600">Pilih jenis pesan yang ingin dibagikan</p>
                  </div>
                </div>
                <Button
                  onClick={() => setIsOpen(false)}
                  variant="outline"
                  size="sm"
                  className="w-8 h-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Share Type Selection */}
              <div className="space-y-4 mb-6">
                <h4 className="text-sm font-medium text-gray-700">Jenis Pesan</h4>
                <div className="grid grid-cols-1 gap-3">
                  {(['full', 'settlement', 'summary'] as ShareType[]).map((type) => (
                    <label
                      key={type}
                      className={`flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        selectedType === type
                          ? 'bg-green-50 border-green-300 shadow-sm'
                          : 'bg-gray-50 border-gray-200 hover:bg-green-50 hover:border-green-200'
                      }`}
                    >
                      <div className="relative">
                        <input
                          type="radio"
                          name="shareType"
                          value={type}
                          checked={selectedType === type}
                          onChange={(e) => setSelectedType(e.target.value as ShareType)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 border-2 rounded-full transition-all duration-200 flex items-center justify-center ${
                          selectedType === type
                            ? 'bg-green-600 border-green-600 text-white'
                            : 'border-gray-300'
                        }`}>
                          {selectedType === type && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-lg">{getTypeIcon(type)}</span>
                          <span className="font-medium text-gray-800 capitalize">
                            {type === 'full' ? 'Pesan Lengkap' : 
                             type === 'settlement' ? 'Pembayaran Saja' : 
                             'Ringkasan'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {getTypeDescription(type)}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Preview Pesan</h4>
                <div className="bg-gray-50 border rounded-lg p-4 max-h-60 overflow-y-auto">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                    {generateMessage(selectedType)}
                  </pre>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleCopyToClipboard}
                  variant="outline"
                  className="flex items-center justify-center space-x-2 flex-1"
                  disabled={copyStatus !== 'idle'}
                >
                  {copyStatus === 'success' ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : copyStatus === 'error' ? (
                    <X className="w-4 h-4 text-red-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span>
                    {copyStatus === 'success' ? 'Copied!' : 
                     copyStatus === 'error' ? 'Error!' : 
                     'Copy to Clipboard'}
                  </span>
                </Button>
                
                <Button
                  onClick={handleOpenWhatsApp}
                  className="flex items-center justify-center space-x-2 flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Buka WhatsApp</span>
                </Button>
              </div>

              {/* Tips */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800">
                  💡 <strong>Tips:</strong> Gunakan "Pesan Lengkap" untuk detail perhitungan, 
                  "Pembayaran Saja" untuk reminder pembayaran, atau "Ringkasan" untuk overview cepat.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
