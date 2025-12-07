async function enviarPedidoPanel() {
  const nombre = document.getElementById('nombreClientePanel').value.trim();
  if (!nombre) {
    alert('⚠️ Ingresa el nombre del cliente');
    return;
  }

  const carrito = obtenerCarrito();
  if (carrito.length === 0) {
    alert('⚠️ El carrito está vacío');
    return;
  }

  // Obtener información del vendedor si está logueado
  const userSession = localStorage.getItem('userSession');
  let vendedorInfo = {
    nombre: 'Cliente directo',
    rol: 'cliente'
  };
  
  if (userSession) {
    const session = JSON.parse(userSession);
    vendedorInfo = {
      nombre: session.nombre,
      email: session.email,
      uid: session.uid,
      rol: session.rol
    };
  }

  const pedido = {
    fecha: new Date().toISOString(),
    cliente: nombre,
    vendedor: vendedorInfo.nombre,
    vendedorEmail: vendedorInfo.email || null,
    vendedorUid: vendedorInfo.uid || null,
    tipoVenta: vendedorInfo.rol === 'vendedor' ? 'Vendedor' : 'Cliente directo',
    productos: carrito.map(p => ({
      codigo: p.codigo,
      nombre: p.nombre,
      cantidad: p.cantidad,
      precioUnitario: p.precio,
      subtotal: p.precio * p.cantidad
    })),
    total: calcularTotal(),
    moneda: 'PEN',
    estado: 'nuevo'
  };

  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js");
    const { getFirestore, collection, addDoc } = await import("https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js");

    const firebaseConfig = {
      apiKey: "AIzaSyAfxunq2yqARtsbyavQZM8_XGC47DNNQWk",
      authDomain: "pedidos-solar-group.firebaseapp.com",
      projectId: "pedidos-solar-group",
      storageBucket: "pedidos-solar-group.firebasestorage.app",
      messagingSenderId: "205423490666",
      appId: "1:205423490666:web:50c23f6ebe6f1b95f8bc13",
      measurementId: "G-Q9VW73GGFS"
    };

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const docRef = await addDoc(collection(db, 'pedidos'), pedido);
    alert('✅ Pedido enviado!\n\nID: ' + docRef.id + '\nTotal: S/ ' + pedido.total.toFixed(2) + '\nVendedor: ' + vendedorInfo.nombre);
    
    vaciarCarrito();
    cerrarCarrito();
    document.getElementById('nombreClientePanel').value = '';
  } catch (e) {
    console.error(e);
    alert('❌ Error: ' + e.message);
  }
}
