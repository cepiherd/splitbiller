import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BillForm } from '../components/BillForm';

// Mock the store
vi.mock('../stores/billStore', () => ({
  useBillStore: () => ({
    createBill: vi.fn(() => 'mock-bill-id'),
    addUser: vi.fn(() => 'mock-user-id'),
  }),
}));

describe('BillForm', () => {
  it('renders form fields correctly', () => {
    render(<BillForm />);
    
    expect(screen.getByLabelText(/judul bill/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/deskripsi/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tambah peserta/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /buat bill/i })).toBeInTheDocument();
  });

  it('adds participant when form is submitted', async () => {
    const user = userEvent.setup();
    render(<BillForm />);
    
    const participantInput = screen.getByLabelText(/tambah peserta/i);
    const addButton = screen.getByRole('button', { name: /tambah/i });
    
    await user.type(participantInput, 'John Doe');
    await user.click(addButton);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(participantInput).toHaveValue('');
  });

  it('removes participant when remove button is clicked', async () => {
    const user = userEvent.setup();
    render(<BillForm />);
    
    const participantInput = screen.getByLabelText(/tambah peserta/i);
    const addButton = screen.getByRole('button', { name: /tambah/i });
    
    await user.type(participantInput, 'John Doe');
    await user.click(addButton);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    
    const removeButton = screen.getByRole('button', { name: '×' });
    await user.click(removeButton);
    
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const onBillCreated = vi.fn();
    render(<BillForm onBillCreated={onBillCreated} />);
    
    const titleInput = screen.getByLabelText(/judul bill/i);
    const participantInput = screen.getByLabelText(/tambah peserta/i);
    const addButton = screen.getByRole('button', { name: /tambah/i });
    const submitButton = screen.getByRole('button', { name: /buat bill/i });
    
    await user.type(titleInput, 'Test Bill');
    await user.type(participantInput, 'John Doe');
    await user.click(addButton);
    await user.click(submitButton);
    
    expect(onBillCreated).toHaveBeenCalledWith('mock-bill-id');
  });

  it('does not submit form without title', async () => {
    const user = userEvent.setup();
    const onBillCreated = vi.fn();
    render(<BillForm onBillCreated={onBillCreated} />);
    
    const participantInput = screen.getByLabelText(/tambah peserta/i);
    const addButton = screen.getByRole('button', { name: /tambah/i });
    const submitButton = screen.getByRole('button', { name: /buat bill/i });
    
    await user.type(participantInput, 'John Doe');
    await user.click(addButton);
    await user.click(submitButton);
    
    expect(submitButton).toBeDisabled();
    expect(onBillCreated).not.toHaveBeenCalled();
  });

  it('does not submit form without participants', async () => {
    const user = userEvent.setup();
    const onBillCreated = vi.fn();
    render(<BillForm onBillCreated={onBillCreated} />);
    
    const titleInput = screen.getByLabelText(/judul bill/i);
    const submitButton = screen.getByRole('button', { name: /buat bill/i });
    
    await user.type(titleInput, 'Test Bill');
    await user.click(submitButton);
    
    expect(submitButton).toBeDisabled();
    expect(onBillCreated).not.toHaveBeenCalled();
  });
});
