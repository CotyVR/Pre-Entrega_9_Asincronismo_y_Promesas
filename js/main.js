const STORAGE_KEY = "frutas";
const RETARDO_AVISO_MS = 4000; 

class Producto {
  constructor(fruta, precio, calidad, id = crypto.randomUUID()) {
    this.id = id;
    this.fruta = fruta;
    this.precio = precio;
    this.calidad = calidad;
  }
}

class ErrorValidacion extends Error {}

const frutasIniciales = [
  new Producto("Manzana", 2500, "Excelente"),
  new Producto("Frutilla", 2000, "Buena"),
  new Producto("Pera", 500, "Regular"),
];


function cargarFrutas() {
  try {
    const guardadas =
      JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? frutasIniciales;
    return guardadas.map(
      ({ id, fruta, precio, calidad }) =>
        new Producto(fruta, precio, calidad, id),
    );
  } catch (error) {
    return [...frutasIniciales];
  }
}

function guardarFrutas() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(frutas));
}

let frutas = cargarFrutas();
guardarFrutas();


const formFruta = document.getElementById("form-fruta");
const inputFruta = document.getElementById("fruta");
const inputPrecio = document.getElementById("precio");
const inputCalidad = document.getElementById("calidad");
const inputBuscar = document.getElementById("input-buscar");
const contenedorFrutas = document.getElementById("contenedor-frutas");
const feedback = document.getElementById("feedback");
const btnVaciar = document.getElementById("btn-vaciar");
const btnAgregar = document.getElementById("btn-agregar");
const aviso = document.getElementById("aviso");
const avisoTexto = document.getElementById("aviso-texto");
const btnCerrarAviso = document.getElementById("btn-cerrar-aviso");

const lblTotalVariedades = document.getElementById("total-variedades");
const lblValorTotal = document.getElementById("valor-total");


let timeoutFeedback;

function mostrarFeedback(mensaje, esError = false) {
  feedback.textContent = mensaje;
  feedback.className = esError ? "feedback error" : "feedback";

  clearTimeout(timeoutFeedback);
  timeoutFeedback = setTimeout(() => feedback.classList.add("hidden"), 3000);
}

function programarAviso() {
  setTimeout(() => {
    const regulares = frutas.filter(
      ({ calidad }) => calidad === "Regular",
    ).length;

    avisoTexto.textContent =
      regulares > 0
        ? `Recordatorio: tienes ${regulares} ${regulares === 1 ? "fruta" : "frutas"} de calidad Regular. ¡Véndelas pronto antes de que se echen a perder!`
        : "Recordatorio: no tienes frutas de calidad Regular. ¡Tu inventario está en buen estado!";

    aviso.classList.remove("hidden");
  }, RETARDO_AVISO_MS);
}

btnCerrarAviso.addEventListener("click", () => aviso.classList.add("hidden"));

function actualizarResumenGlobal() {
  lblTotalVariedades.textContent = frutas.length;

  const total = frutas.reduce((acc, { precio }) => acc + precio, 0);
  lblValorTotal.textContent = `$${total.toLocaleString("es-CL")}`;
}

function renderizarFrutas() {
  const termino = inputBuscar.value.toLowerCase().trim();
  const lista = frutas.filter(({ fruta }) =>
    fruta.toLowerCase().includes(termino),
  );

  contenedorFrutas.innerHTML = "";

  if (lista.length === 0) {
    const mensaje = termino
      ? "No se encontraron frutas."
      : "El catálogo está vacío.";
    contenedorFrutas.innerHTML = `<p style="text-align:center; color:#64748b;">${mensaje}</p>`;
  } else {
    lista.forEach((item) => {
      const { id, fruta, precio, calidad } = item;

      const card = document.createElement("div");
      card.classList.add("card-fruta");
      card.innerHTML = `
        <div class="fruta-detalle">
          <h3>${fruta}</h3>
          <p>Calidad: ${calidad}</p>
          <p>Precio: $${precio.toLocaleString("es-CL")}</p>
        </div>
        <button class="btn-vender" data-id="${id}">Vendido</button>
      `;
      contenedorFrutas.appendChild(card);
    });
  }

  actualizarResumenGlobal();
}


function ejecutarVenta(id) {
  const productoEncontrado = frutas.find((p) => p.id === id);
  if (!productoEncontrado) return;

  const { fruta } = productoEncontrado;

  frutas = frutas.filter((p) => p.id !== id);
  guardarFrutas();
  renderizarFrutas();

  mostrarFeedback(`"${fruta}" fue removida del catálogo.`);
}

function vaciarCatalogo() {
  frutas = [];
  guardarFrutas();
  renderizarFrutas();
  mostrarFeedback("Catálogo vaciado.");
}

function agregarFruta() {
  const nombre = inputFruta.value.trim();
  const precio = Number(inputPrecio.value);
  const calidad = inputCalidad.value;

  if (!nombre) throw new ErrorValidacion("Ingresa el nombre de la fruta.");
  if (!Number.isFinite(precio) || precio <= 0)
    throw new ErrorValidacion("Ingresa un precio válido.");
  if (frutas.some((p) => p.fruta.toLowerCase() === nombre.toLowerCase())) {
    throw new ErrorValidacion(`"${nombre}" ya existe en el catálogo.`);
  }

  const nuevoProducto = new Producto(nombre, precio, calidad);
  frutas.push(nuevoProducto);

  try {
    guardarFrutas(); 
  } catch (error) {
    frutas = frutas.filter((p) => p.id !== nuevoProducto.id);
    throw error;
  }

  return nuevoProducto;
}


contenedorFrutas.addEventListener("click", (e) => {
  const id = e.target.closest(".btn-vender")?.dataset.id;
  if (id) ejecutarVenta(id);
});

formFruta.addEventListener("submit", (e) => {
  e.preventDefault();
  btnAgregar.disabled = true;

  try {
    const { fruta } = agregarFruta(); 
    formFruta.reset();
    renderizarFrutas();
    mostrarFeedback(`"${fruta}" añadida al inventario.`);
  } catch (error) {
    const mensaje =
      error instanceof ErrorValidacion
        ? error.message
        : "No se pudo procesar la operación, intenta de nuevo.";

    console.error(error);
    mostrarFeedback(`${mensaje}`, true);
  } finally {
    btnAgregar.disabled = false;
    inputFruta.focus();
  }
});

inputBuscar.addEventListener("input", renderizarFrutas);
btnVaciar.addEventListener("click", vaciarCatalogo);

document.addEventListener("DOMContentLoaded", () => {
  renderizarFrutas();
  programarAviso();
});
