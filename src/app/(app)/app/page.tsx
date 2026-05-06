const AppHomePage = () => {
  return (
    <main className="space-y-3">
      <h1 className="text-3xl font-semibold">Authenticated Shell</h1>
      <p className="text-zinc-600">
        Phase 2 foundation is active. This route is protected by middleware and requires an
        authenticated user.
      </p>
    </main>
  );
};

export default AppHomePage;
