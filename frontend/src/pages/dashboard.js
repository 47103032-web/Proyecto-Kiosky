import React from 'react';

const Dashboard = () => {
  // Datos simulados (mock) para la vista
  const ventasDelDia = 85450;
  const stockBajo = [
    { id: 1, nombre: 'Papas Fritas Clásicas 120g', stockActual: 2, stockMinimo: 10 },
    { id: 2, nombre: 'Agua Mineral 500ml', stockActual: 5, stockMinimo: 12 }
  ];
  const proximosVencer = [
    { id: 1, nombre: 'Leche Entera 1L', fecha: '15/09/2026', diasRestantes: 2 },
    { id: 2, nombre: 'Yogur Frutilla 200g', fecha: '18/09/2026', diasRestantes: 5 }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Dashboard</h1>

      {/* Accesos Rápidos */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <button className="bg-blue-600 text-white p-4 rounded-lg shadow hover:bg-blue-700 transition">
          🛒 Nueva Venta
        </button>
        <button className="bg-green-600 text-white p-4 rounded-lg shadow hover:bg-green-700 transition">
          📦 Agregar Producto
        </button>
        <button className="bg-purple-600 text-white p-4 rounded-lg shadow hover:bg-purple-700 transition">
          📊 Reporte de Ventas
        </button>
        <button className="bg-red-600 text-white p-4 rounded-lg shadow hover:bg-red-700 transition">
          ⚠️ Productos Vencidos
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tarjeta de Ventas del Día */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <h2 className="text-lg font-semibold text-gray-600 mb-2">Ventas del Día</h2>
          <p className="text-4xl font-bold text-gray-800">${ventasDelDia.toLocaleString()}</p>
        </div>

        {/* Tarjeta de Stock Bajo */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
          <h2 className="text-lg font-semibold text-gray-600 mb-4">Productos con Stock Bajo</h2>
          <ul className="divide-y divide-gray-200">
            {stockBajo.map(prod => (
              <li key={prod.id} className="py-2 flex justify-between items-center">
                <span className="text-gray-700">{prod.nombre}</span>
                <span className="bg-yellow-100 text-yellow-800 py-1 px-3 rounded-full text-sm font-medium">
                  {prod.stockActual} / {prod.stockMinimo}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Tarjeta de Próximos a Vencer */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500 md:col-span-2">
          <h2 className="text-lg font-semibold text-gray-600 mb-4">Productos Próximos a Vencer</h2>
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-500 border-b">
                <th className="pb-2">Producto</th>
                <th className="pb-2">Vencimiento</th>
                <th className="pb-2 text-right">Días Restantes</th>
              </tr>
            </thead>
            <tbody>
              {proximosVencer.map(prod => (
                <tr key={prod.id} className="border-b last:border-0">
                  <td className="py-3 text-gray-800">{prod.nombre}</td>
                  <td className="py-3 text-gray-600">{prod.fecha}</td>
                  <td className="py-3 text-right text-red-600 font-bold">{prod.diasRestantes} días</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;