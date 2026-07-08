<template>
  <footer>
    <div class="contenedor-footer">
      <!-- 1) Logo -->
      <div class="columna-footer logo-hacienda">
        <a href="https://www.gob.mx/shcp"
          ><img alt="Logo Hacienda" src="@/assets/footer/logo_hacienda.png" />
        </a>
      </div>
      <!-- 2) Sitios de interés -->

      <div class="columna-footer">
        <h2>Sitios de inter&eacute;s</h2>

        <ul>
          <li><a href="/Mapa-Sitio">Mapa de sitio</a></li>
          <li>
            <a href="/Recomendaciones-Consulta">Recomendaciones de consulta</a>
          </li>
          <li><a href="/es/PTP/Glosario">Glosario</a></li>
          <li>
            <a href="/es/PTP/Estadisticas">Estad&iacute;sticas del portal</a>
          </li>
        </ul>
      </div>
      <!-- 3) Contacto -->

      <div class="columna-footer columna-contacto">
        <h2>Contacto</h2>

        <p>
          Palacio Nacional. Plaza de la Constituci&oacute;n s/n.<br />
          Colonia Centro. Alcald&iacute;a Cuauht&eacute;moc.<br />
          Ciudad de M&eacute;xico.
        </p>
        <a href="/es/PTP/Terminos_y_Condiciones"
          >T&eacute;rminos y condiciones del uso de la informaci&oacute;n</a
        >
      </div>
      <!-- 4) Síguenos -->

      <div class="columna-footer">
        <h2>S&iacute;guenos</h2>

        <div class="redes-sociales">
          <!-- Facebook -->
          <a aria-label="Facebook" href="https://www.facebook.com/tpresupuestaria">
            <svg viewbox="0 0 24 24">
              <path
                clip-rule="evenodd"
                d="M22 12c0-5.523-4.477-10-10-10S2 6.477 
                  2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 
                  1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 
                  0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 
                  21.128 22 16.991 22 12z"
                fill-rule="evenodd"
              ></path>
            </svg>
          </a>
          <!-- X -->
          <a aria-label="X" href="https://x.com/tpresupuestaria">
            <svg fill="currentColor" viewbox="0 0 24 24">
              <path
                clip-rule="evenodd"
                d="M5.9199219 6 L20.582031 27.375 L6.2304688 44 L9.4101562 44 L21.986328 29.421875 L31.986328 44 L44 44 L28.681641 21.669922 L42.199219 6 L39.029297 6 L27.275391 19.617188 L17.933594 6 L5.9199219 6 z M9.7167969 8 L16.880859 8 L40.203125 42 L33.039062 42 L9.7167969 8 z"
                fill-rule="evenodd"
                style="scale: 0.5"
              ></path>
            </svg>
          </a>
          <!-- Instagram -->
          <a aria-label="Instagram" href="https://www.instagram.com/tpresupuestaria">
            <svg viewbox="0 0 24 24">
              <path
                clip-rule="evenodd"
                d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 
                  1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 
                  4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 
                  2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 
                  2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 
                  4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 
                  0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 
                  4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 
                  2.525c.636-.247 1.363-.416 2.427-.465C8.901 
                  2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 
                  0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 
                  1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 
                  2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 
                  1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 
                  4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 
                  1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 
                  3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 
                  6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 
                  1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 
                  1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                fill-rule="evenodd"
              ></path>
            </svg>
          </a>
          <!-- YouTube -->
          <a aria-label="YouTube" href="https://www.youtube.com/@tpresupuestaria">
            <svg viewbox="0 0 24 24">
              <path
                d="M23.499 6.203a2.694 2.694 0 00-1.897-1.9C19.654 
                      4 12 4 12 4s-7.654 0-9.602.303a2.694 2.694 0 00-1.897 
                      1.9A28.796 28.796 0 000 12a28.796 28.796 0 00.501 
                      5.797 2.694 2.694 0 001.897 1.9C4.346 20 12 20 12 
                      20s7.654 0 9.602-.303a2.694 2.694 0 001.897-1.9A28.796 
                      28.796 0 0024 12a28.796 28.796 0 00-.501-5.797zM9.545 
                      15.568V8.432L15.818 12l-6.273 3.568z"
              ></path>
            </svg>
          </a>
          <!-- Correo -->
          <a aria-label="Correo" href="mailto:trans_presupuestaria@hacienda.gob.mx">
            <svg viewbox="0 0 24 24">
              <path
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 
                  19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 
                  2v10a2 2 0 002 2z"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
              ></path>
            </svg>
          </a>
          <!-- LinkedIn -->
          <a aria-label="LinkedIn" href="https://www.linkedin.com/company/tpresupuestaria">
            <svg viewbox="0 0 24 24">
              <path
                d="M20.447 20.452h-3.554v-5.569c0-1.328-.026-3.037-1.852-3.037-1.853 
                      0-2.136 1.447-2.136 2.942v5.664H9.347V9h3.414v1.561h.049c.476-.9 
                      1.637-1.852 3.372-1.852 3.602 0 4.267 2.371 4.267 
                      5.456v6.287zM5.337 7.433a2.062 2.062 0 11-.001-4.124 
                      2.062 2.062 0 01.001 4.124zM7.119 20.452H3.554V9h3.565v11.452z"
              ></path>
            </svg>
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup></script>

<style scoped>
footer {
  background-color: #3a4049;
  color: #fff;
  padding: 40px 20px;
}

.contenedor-footer {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 32px;
  align-items: start;
  padding: 0 1rem;
}

.columna-footer h2 {
  margin: 0;

  font-size: 16px;
  font-weight: bold;
  margin-bottom: 16px;
  font-family: "Patria", sans-serif;

  text-align: left;
  /* text-transform: uppercase; */
}

.columna-footer ul {
  list-style: none;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: "NotoSans", sans-serif;
}

.columna-footer ul li + li {
  margin-top: 8px;
}

.columna-footer a {
  color: #fff;
  text-decoration: none;
  font-size: 14px;
  font-family: "NotoSans", sans-serif;
}

.columna-footer a:hover {
  text-decoration: underline;
}

/* — Logo — */
.logo-hacienda img {
  max-height: 60px;
  display: block;
  margin-bottom: 16px;
}

/* — Redes sociales en grid 3×2 — */
.redes-sociales {
  display: grid;
  grid-template-columns: repeat(3, 36px);
  gap: 0.8rem;
  justify-content: start;
}

.redes-sociales a {
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  transition:
    background 0.3s,
    transform 0.2s;
}

.redes-sociales a:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.1);
}

.redes-sociales svg {
  width: 24px;
  height: 24px;
  fill: currentColor;
}

/* — Texto de párrafo en contacto — */
.columna-contacto p {
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 12px;
  font-family: "NotoSans", sans-serif;
  text-align: left;
}

@media (max-width: 992px) {
  .contenedor-footer {
    grid-template-columns: repeat(2, 1fr);
    align-items: start;
  }

  .logo-hacienda {
    align-self: center;
  }
}

@media (max-width: 600px) {
  .contenedor-footer {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .columna-footer h2 {
    text-align: center;
  }

  .redes-sociales {
    justify-self: center;
  }

  .logo-hacienda {
    justify-self: center;
  }

  .columna-contacto p {
    text-align: center;
  }
}
</style>
