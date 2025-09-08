import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useBillStore } from '../stores/billStore';
import type { User } from '../types/bill';

interface BillFormProps {
  onBillCreated?: (billId: string) => void;
}

export const BillForm: React.FC<BillFormProps> = ({ onBillCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [participants, setParticipants] = useState<User[]>([]);
  
  const { createBill, addUser } = useBillStore();

  const handleAddParticipant = () => {
    if (participantName.trim()) {
      const userId = addUser({ name: participantName.trim() });
      const newParticipant: User = { id: userId, name: participantName.trim() };
      setParticipants([...participants, newParticipant]);
      setParticipantName('');
    }
  };

  const handleRemoveParticipant = (userId: string) => {
    setParticipants(participants.filter(p => p.id !== userId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || participants.length === 0) {
      alert('Please fill in title and add at least one participant');
      return;
    }

    const billId = createBill({
      title: title.trim(),
      description: description.trim() || undefined,
      totalAmount: 0,
      participants,
      expenses: [],
      createdBy: participants[0].id, // First participant as creator
      isActive: true,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setParticipants([]);
    setParticipantName('');

    onBillCreated?.(billId);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-white shadow-md border">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl sm:text-2xl text-gray-800">Buat Bill Baru</CardTitle>
        <CardDescription className="text-gray-600">
          Mulai dengan menambahkan judul dan peserta untuk bill Anda
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm sm:text-base font-medium text-gray-700">
              Judul Bill *
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Makan malam di restoran"
              className="text-sm sm:text-base"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm sm:text-base font-medium text-gray-700">
              Deskripsi (Opsional)
            </label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tambahkan deskripsi untuk bill ini"
              className="text-sm sm:text-base"
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="participant" className="text-sm sm:text-base font-medium text-gray-700">
                Tambah Peserta *
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  id="participant"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  placeholder="Nama peserta"
                  className="text-sm sm:text-base flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddParticipant())}
                />
                <Button 
                  type="button" 
                  onClick={handleAddParticipant}
                  className="px-6 py-2 text-sm sm:text-base font-semibold bg-green-600 hover:bg-green-700 text-white shadow-md"
                >
                  + Tambah
                </Button>
              </div>
            </div>

            {participants.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm sm:text-base font-medium text-gray-700">Peserta ({participants.length})</p>
                <div className="flex flex-wrap gap-2">
                  {participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="inline-flex items-center space-x-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-full hover:bg-blue-100 transition-colors group"
                    >
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                        {participant.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-blue-800 font-medium">{participant.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveParticipant(participant.id)}
                        className="w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold transition-colors opacity-0 group-hover:opacity-100"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full py-4 text-base sm:text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" 
            disabled={!title.trim() || participants.length === 0}
          >
            🚀 Buat Bill Baru
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
