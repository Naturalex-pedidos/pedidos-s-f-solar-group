// Funciones para manejar el carrito en localStorage

function obtenerCarrito() {
  const carrito = localStorage.getItem('carrito');
  return carrito ? JSON.parse(carrito) : [];
}

function guardarCarrito(carrito) {
  localStorage.setItem('carrito', JSON.stringify(carrito));
  actualizarBadgeCarrito();
  actualizarPanelCarrito();
}

function agregarAlCarrito(producto) {
  let carrito = obtenerCarrito();
  const existe = carrito.find(p => p.codigo === producto.codigo);
  
  if (existe) {
    existe.cantidad++;
  } else {
    carrito.push({ ...producto, cantidad: 1 });
  }
  
  guardarCarrito(carrito);
}

function quitarDelCarrito(codigo) {
  let carrito = obtenerCarrito();
  const producto = carrito.find(p => p.codigo === codigo);
  
  if (producto) {
    producto.cantidad--;
    if (producto.cantidad <= 0) {
      carrito = carrito.filter(p => p.codigo !== codigo);
    }
  }
  
  guardarCarrito(carrito);
}

function eliminarDelCarrito(codigo) {
  let carrito = obtenerCarrito();
  carrito = carrito.filter(p => p.codigo !== codigo);
  guardarCarrito(carrito);
}

function obtenerCantidadProducto(codigo) {
  const carrito = obtenerCarrito();
  const producto = carrito.find(p => p.codigo === codigo);
  return producto ? producto.cantidad : 0;
}

function calcularTotal() {
  const carrito = obtenerCarrito();
  return carrito.reduce((total, p) => total + (p.precio * p.cantidad), 0);
}

function contarItems() {
  const carrito = obtenerCarrito();
  return carrito.reduce((total, p) => total + p.cantidad, 0);
}

function vaciarCarrito() {
  localStorage.removeItem('carrito');
  actualizarBadgeCarrito();
  actualizarPanelCarrito();
}

function actualizarBadgeCarrito() {
  const badge = document.getElementById('cantidadCarrito');
  if (badge) {
    const count = contarItems();
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline' : 'none';
  }
}

function abrirCarrito() {
  document.getElementById('panelCarrito').classList.add('abierto');
  actualizarPanelCarrito();
}

function cerrarCarrito() {
  document.getElementById('panelCarrito').classList.remove('abierto');
}

function actualizarPanelCarrito() {
  const carrito = obtenerCarrito();
  const lista = document.getElementById('listaCarritoPanel');
  const totalEl = document.getElementById('totalCarritoPanel');
  const vacioEl = document.getElementById('carritoVacio');
  const contenidoEl = document.getElementById('carritoContenido');
  
  if (!lista) return;
  
  if (carrito.length === 0) {
    vacioEl.style.display = 'block';
    contenidoEl.style.display = 'none';
    return;
  }
  
  vacioEl.style.display = 'none';
  contenidoEl.style.display = 'block';
  
  lista.innerHTML = '';
  carrito.forEach(item => {
    const div = document.createElement('div');
    div.className = 'item-carrito';
    div.innerHTML = `
      <div class="item-info">
        <div class="item-nombre">${item.nombre}</div>
        <div class="item-codigo">COD: ${item.codigo}</div>
        <div class="item-precio">S/ ${item.precio.toFixed(2)} x ${item.cantidad}</div>
      </div>
      <div class="item-acciones">
        <div class="item-subtotal">S/ ${(item.precio * item.cantidad).toFixed(2)}</div>
        <button class="btn-eliminar" onclick="eliminarDelCarrito('${item.codigo}')">🗑️</button>
      </div>
    `;
    lista.appendChild(div);
  });
  
  const total = calcularTotal();
  totalEl.textContent = 'S/ ' + total.toFixed(2);
}

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
