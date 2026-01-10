function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Leads" value="45" color="blue" />
        <StatCard title="Active Projects" value="12" color="orange" />
        <StatCard title="This Month Revenue" value="₹12.5L" color="green" />
        <StatCard title="Pending Invoices" value="8" color="red" />
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Welcome to Shine Solar Management System</h2>
        <p className="text-gray-600">
          Your complete offline solution for managing solar installation business.
        </p>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickAction title="Add New Lead" description="Create a new customer lead" href="/leads" />
          <QuickAction title="Create Quotation" description="Generate quotation for customer" href="/quotations" />
          <QuickAction title="New Invoice" description="Create GST invoice" href="/invoices" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color }: { title: string; value: string; color: string }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    orange: 'bg-orange-50 text-orange-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      <p className={`text-3xl font-bold mt-2 ${colors[color as keyof typeof colors]}`}>{value}</p>
    </div>
  );
}

function QuickAction({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <a
      href={href}
      className="block p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
    >
      <h3 className="font-semibold text-gray-800">{title}</h3>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
    </a>
  );
}

export default Dashboard;
