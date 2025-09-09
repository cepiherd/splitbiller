import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useBillStore } from '../stores/billStore';
import type { User, CreateSubsidy } from '../types/bill';
import { Plus, X } from 'lucide-react';

interface SubsidyFormProps {
  billId: string;
  participants: User[];
  onSubsidyAdded?: () => void;
}

export const SubsidyForm: React.FC<SubsidyFormProps> = ({ billId, participants, onSubsidyAdded }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [distributedBy, setDistributedBy] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  
  const { addSubsidy } = useBillStore();

  const handleAddParticipant = (userId: string) => {
    if (!selectedParticipants.includes(userId)) {
      setSelectedParticipants([...selectedParticipants, userId]);
    }
  };

  const handleRemoveParticipant = (userId: string) => {
    setSelectedParticipants(selectedParticipants.filter(id => id !== userId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim() || !amount || !distributedBy || selectedParticipants.length === 0) {
      alert('Harap isi semua field dan pilih minimal satu peserta');
      return;
    }

    const subsidyAmount = parseFloat(amount);
    if (isNaN(subsidyAmount) || subsidyAmount <= 0) {
      alert('Jumlah subsidi harus berupa angka positif');
      return;
    }

    const subsidyData: CreateSubsidy = {
      description: description.trim(),
      amount: subsidyAmount,
      distributedBy,
      participants: selectedParticipants,
      billId,
    };

    addSubsidy(subsidyData);

    // Reset form
    setDescription('');
    setAmount('');
    setDistributedBy('');
    setSelectedParticipants([]);
    setIsOpen(false);

    onSubsidyAdded?.();
  };

  const handleCancel = () => {
    setDescription('');
    setAmount('');
    setDistributedBy('');
    setSelectedParticipants([]);
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="w-full py-3 text-base font-semibold bg-green-600 hover:bg-green-700 text-white shadow-md"
      >
        <Plus className="w-4 h-4 mr-2" />
        Tambah Subsidi Dana
      </Button>
    );
  }

  return (
    <Card className="w-full bg-green-50 border-green-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg text-green-800">Tambah Subsidi Dana</CardTitle>
        <CardDescription className="text-green-600">
          Bagikan subsidi kepada peserta yang dipilih
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="subsidy-description" className="text-sm font-medium text-gray-700">
              Deskripsi Subsidi *
            </label>
            <Input
              id="subsidy-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Subsidi makan siang dari perusahaan"
              className="text-sm"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="subsidy-amount" className="text-sm font-medium text-gray-700">
              Jumlah Subsidi (Rp) *
            </label>
            <Input
              id="subsidy-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100000"
              className="text-sm"
              min="0"
              step="1000"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="distributed-by" className="text-sm font-medium text-gray-700">
              Dibagikan Oleh *
            </label>
            <select
              id="distributed-by"
              value={distributedBy}
              onChange={(e) => setDistributedBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">Pilih peserta</option>
              {participants.map((participant) => (
                <option key={participant.id} value={participant.id}>
                  {participant.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Pilih Penerima Subsidi *
            </label>
            <div className="space-y-2">
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`participant-${participant.id}`}
                    checked={selectedParticipants.includes(participant.id)}
                    onChange={() => {
                      if (selectedParticipants.includes(participant.id)) {
                        handleRemoveParticipant(participant.id);
                      } else {
                        handleAddParticipant(participant.id);
                      }
                    }}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <label htmlFor={`participant-${participant.id}`} className="text-sm text-gray-700">
                    {participant.name}
                  </label>
                </div>
              ))}
            </div>
            {selectedParticipants.length > 0 && (
              <div className="mt-2 p-2 bg-green-100 rounded text-sm text-green-800">
                <strong>Subsidi per orang:</strong> Rp {amount ? (parseFloat(amount) / selectedParticipants.length).toLocaleString('id-ID') : '0'}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              className="flex-1 py-2 text-sm font-semibold bg-green-600 hover:bg-green-700 text-white"
              disabled={!description.trim() || !amount || !distributedBy || selectedParticipants.length === 0}
            >
              Simpan Subsidi
            </Button>
            <Button
              type="button"
              onClick={handleCancel}
              variant="outline"
              className="px-4 py-2 text-sm font-semibold text-gray-600 border-gray-300 hover:bg-gray-50"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
