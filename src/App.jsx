import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Layout from "./components/Layout";


/* ======================================================
   PÚBLICO
====================================================== */

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Contacto from "./pages/Contacto";
import Ubicacion from "./pages/Ubicacion";


/* ======================================================
   CLIENTES
====================================================== */

import MenuCliente from "./pages/MenuCliente";
import Cotizaciones from "./pages/cotizaciones";
import CrearCotizacion from "./pages/CrearCotizacion";
import MisProyectos from "./pages/MisProyectos";
import Favoritos from "./pages/favoritos";
import ChatIA from "./pages/ChatIA";
import Perfil from "./pages/Perfil";
import Carrito from "./pages/Carrito";


/* ======================================================
   ADMIN
====================================================== */

import MenuAdmin from "./pages/MenuAdmin";
import Clientes from "./pages/Clientes";
import CotizacionesAdmin from "./pages/CotizacionesAdmin";
import ProyectosTerminadosAdmin from "./pages/ProyectosTerminadosAdmin";


/* ======================================================
   PROYECTOS
====================================================== */

import Proyectos from "./pages/Proyectos";
import SubirProyecto from "./pages/SubirProyecto";
import DetalleProyecto from "./pages/DetalleProyecto";


/* ======================================================
   TIENDA MACRO
====================================================== */

import Tienda from "./pages/Tienda";
import SubirProducto from "./pages/SubirProducto";
import DetalleProducto from "./pages/DetalleProducto";


function App() {
  return (
    <Routes>

      <Route element={<Layout />}>

        {/* ================================================= */}
        {/* PÚBLICO */}
        {/* ================================================= */}

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/contacto"
          element={<Contacto />}
        />

        <Route
          path="/ubicacion"
          element={<Ubicacion />}
        />


        {/* ================================================= */}
        {/* TIENDA MACRO */}
        {/* ================================================= */}

        <Route
          path="/tienda"
          element={<Tienda />}
        />

        <Route
          path="/producto/:id"
          element={<DetalleProducto />}
        />

        <Route
          path="/carrito"
          element={<Carrito />}
        />


        {/* ================================================= */}
        {/* PROYECTOS */}
        {/* ================================================= */}

        <Route
          path="/proyectos"
          element={<Proyectos />}
        />

        <Route
          path="/proyecto/:id"
          element={<DetalleProyecto />}
        />


        {/* ================================================= */}
        {/* CLIENTE */}
        {/* ================================================= */}

        <Route
          path="/cliente"
          element={<MenuCliente />}
        />

        <Route
          path="/cliente/cotizaciones"
          element={<Cotizaciones />}
        />

        <Route
          path="/cliente/mis-proyectos"
          element={<MisProyectos />}
        />

        <Route
          path="/crear-cotizacion"
          element={<CrearCotizacion />}
        />

        <Route
          path="/favoritos"
          element={<Favoritos />}
        />

        <Route
          path="/chat-ia"
          element={<ChatIA />}
        />

        <Route
          path="/perfil"
          element={<Perfil />}
        />


        {/* ================================================= */}
        {/* ADMIN */}
        {/* ================================================= */}

        <Route
          path="/admin"
          element={<MenuAdmin />}
        />

        <Route
          path="/admin/clientes"
          element={<Clientes />}
        />

        <Route
          path="/admin/cotizaciones"
          element={<CotizacionesAdmin />}
        />

        {/* MISMO PERFIL PARA ADMIN */}

        <Route
          path="/admin/perfil"
          element={<Perfil />}
        />

        <Route
          path="/admin/proyectos-terminados"
          element={<ProyectosTerminadosAdmin />}
        />

        <Route
          path="/admin/subir-proyecto"
          element={<SubirProyecto />}
        />

        <Route
          path="/admin/subir-producto"
          element={<SubirProducto />}
        />


        {/* ================================================= */}
        {/* REDIRECCIONES ANTIGUAS */}
        {/* ================================================= */}

        <Route
          path="/cotizaciones"
          element={
            <Navigate
              to="/cliente/cotizaciones"
              replace
            />
          }
        />

        <Route
          path="/mis-proyectos"
          element={
            <Navigate
              to="/cliente/mis-proyectos"
              replace
            />
          }
        />

        <Route
          path="/galeria"
          element={
            <Navigate
              to="/tienda"
              replace
            />
          }
        />

        <Route
          path="/subir-galeria"
          element={
            <Navigate
              to="/admin/subir-producto"
              replace
            />
          }
        />

        <Route
          path="/admin/productos"
          element={
            <Navigate
              to="/admin/subir-producto"
              replace
            />
          }
        />


        {/* ================================================= */}
        {/* RUTA DESCONOCIDA */}
        {/* ================================================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Route>

    </Routes>
  );
}


export default App;