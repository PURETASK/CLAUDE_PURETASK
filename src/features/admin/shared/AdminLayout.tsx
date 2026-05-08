export const AdminLayout = ({ title, children }: { title: string; children: React.ReactNode }) => {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
      {children}
    </div>
  );
};
