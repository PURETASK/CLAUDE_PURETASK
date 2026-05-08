import { NewTicketForm } from './NewTicketForm';

export default function NewTicketPage() {
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-xl font-semibold">Open a support ticket</h1>
      <NewTicketForm />
    </div>
  );
}
