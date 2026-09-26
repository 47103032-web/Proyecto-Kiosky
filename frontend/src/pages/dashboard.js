import React from 'react';

const Dashboard = () => {
  // Datos simulados basados en el wireframe del proyecto
  const metricas = {
    ventasDia: 85450,
    ventasSemana: 512300,
    productosTotales: 652,
    clientesRegistrados: 248,
  };

  const alertasStockBajo = [
    { id: 1, nombre: 'Guaraná Cola 2.25L', stockActual: 3, stockMinimo: 10 },
    { id: 2, nombre: 'Agua Mineral 500ml', stockActual: 5, stockMinimo: 12 },
    { id: 3, nombre: 'Papas Fritas Clásicas', stockActual: 2, stockMinimo: 6 },
  ];

  const alertasVencimiento = [
    { id: 1, nombre: 'Leche Entera 1L', vencimiento: '15/08/2026', diasRestantes: 7 },
    { id: 2, nombre: 'Yogur Frutilla', vencimiento: '12/08/2026', diasRestantes: 4 },
    { id: 3, nombre: 'Queso Cremoso 200g', vencimiento: '10/08/2026', diasRestantes: 2 },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-500">Resumen general de tu negocio</p>
        </div>
        <div className="text-sm text-gray-500">08 de agosto de 2026</div>
      </header>

      {/* Tarjetas de Resumen General */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-gray-500 text-sm">Ventas del día</h3>
          <p className="text-2xl font-bold">${metricas.ventasDia.toLocaleString('es-AR')}</p>
          <span className="text-green-500 text-xs">↗ 12% vs ayer</span>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-gray-500 text-sm">Ventas de la semana</h3>
          <p className="text-2xl font-bold">${metricas.ventasSemana.toLocaleString('es-AR')}</p>
          <span className="text-green-500 text-xs">↗ 8% vs semana pasada</span>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-gray-500 text-sm">Productos totales</h3>
          <p className="text-2xl font-bold">{metricas.productosTotales}</p>
          <span className="text-gray-400 text-xs">— sin cambios</span>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-gray-500 text-sm">Clientes registrados</h3>
          <p className="text-2xl font-bold">{metricas.clientesRegistrados}</p>
          <span className="text-red-500 text-xs">↘ 5% vs mes pasado</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Columna Izquierda: Gráfico y Vencimientos */}
        <div>
          {/* Contenedor del Gráfico de Ventas del Día */}
          <div className="bg-white p-4 rounded shadow mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">Ventas del día</h3>
              <select className="border text-sm p-1 rounded"><option>Hoy</option></select>
            </div>
            <div className="h-48 bg-gray-100 flex items-center justify-center text-gray-400 rounded">
              {/* Aquí iría el componente del gráfico (ej. Recharts o Chart.js) */}
              [Gráfico de líneas]
            </div>
          </div>

          {/* Alertas: Productos próximos a vencer */}
          <div className="bg-white p-4 rounded shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">Productos próximos a vencer</h3>
              <button className="text-blue-500 text-sm">Ver todos</button>
            </div>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-500 border-b">
                  <th className="pb-2">Producto</th>
                  <th className="pb-2">Vencimiento</th>
                  <th className="pb-2">Días restantes</th>
                  <th className="pb-2">Acción</th>
                </tr>
              </thead>
              <tbody>
                {alertasVencimiento.map((prod) => (
                  <tr key={prod.id} className="border-b last:border-0">
                    <td className="py-2">{prod.nombre}</td>
                    <td className="py-2">{prod.vencimiento}</td>
                    <td className="py-2 text-red-500">{prod.diasRestantes} días</td>
                    <td className="py-2"><button className="border px-2 py-1 rounded text-xs">Ver</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Columna Derecha: Stock Bajo y Accesos Rápidos */}
        <div>
          {/* Alertas: Productos con stock bajo */}
          <div className="bg-white p-4 rounded shadow mb-8 border-l-4 border-yellow-500">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">Productos con stock bajo</h3>
              <button className="text-blue-500 text-sm">Ver todos</button>
            </div>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-500 border-b">
                  <th className="pb-2">Producto</th>
                  <th className="pb-2">Stock actual</th>
                  <th className="pb-2">Stock mínimo</th>
                  <th className="pb-2">Acción</th>
                </tr>
              </thead>
              <tbody>
                {alertasStockBajo.map((prod) => (
                  <tr key={prod.id} className="border-b last:border-0">
                    <td className="py-2">{prod.nombre}</td>
                    <td className="py-2 font-bold text-red-500">{prod.stockActual}</td>
                    <td className="py-2 text-gray-500">{prod.stockMinimo}</td>
                    <td className="py-2"><button className="border px-2 py-1 rounded text-xs">Ver</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Accesos Rápidos */}
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-bold mb-4">Accesos rápidos</h3>
            <div className="grid grid-cols-3 gap-4">
              <button className="flex flex-col items-center justify-center p-4 border rounded hover:bg-gray-50">
                <span className="text-2xl mb-2">🛒</span>
                <span className="text-xs">Nueva venta</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 border rounded hover:bg-gray-50">
                <span className="text-2xl mb-2">📦</span>
                <span className="text-xs">Agregar producto</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 border rounded hover:bg-gray-50">
                <span className="text-2xl mb-2">👤</span>
                <span className="text-xs">Nuevo cliente</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 border rounded hover:bg-gray-50">
                <span className="text-2xl mb-2">📊</span>
                <span className="text-xs">Reporte de ventas</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 border rounded hover:bg-gray-50">
                <span className="text-2xl mb-2">⚠️</span>
                <span className="text-xs">Stock bajo</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 border rounded hover:bg-gray-50">
                <span className="text-2xl mb-2">🗑️</span>
                <span className="text-xs">Productos vencidos</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;


