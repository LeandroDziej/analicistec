/*
 * AntiEstafa AR · botón "¿Es estafa?" para cualquier página web.
 * Uso: <script src="https://TU-DOMINIO/widget.js" defer></script>
 * Abre el detector en un panel, sin salir de la página. No lee nada de la página que lo incluye.
 */
(function () {
  if (window.__antiestafaWidget) return;
  window.__antiestafaWidget = true;

  var script = document.currentScript;
  var origen = script ? new URL(script.src).origin : "https://antiestafa-ar-2.vercel.app";

  var boton = document.createElement("button");
  boton.type = "button";
  boton.textContent = "🛡️ ¿Es estafa?";
  boton.setAttribute("aria-haspopup", "dialog");
  boton.style.cssText =
    "position:fixed;left:16px;bottom:16px;z-index:2147483646;padding:14px 20px;border:0;border-radius:999px;" +
    "background:#0b5a68;color:#fff;font:700 16px/1 system-ui,sans-serif;box-shadow:0 8px 24px rgba(11,90,104,.35);cursor:pointer";

  var panel = null;

  function cerrar() {
    if (!panel) return;
    panel.remove();
    panel = null;
    boton.setAttribute("aria-expanded", "false");
    boton.focus();
  }

  function abrir() {
    if (panel) return cerrar();
    panel = document.createElement("div");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Detector de estafas");
    panel.style.cssText =
      "position:fixed;left:16px;bottom:80px;z-index:2147483647;width:min(420px,calc(100vw - 32px));height:min(640px,calc(100vh - 112px));" +
      "background:#fff;border-radius:20px;box-shadow:0 24px 60px rgba(18,48,58,.35);overflow:hidden;display:flex;flex-direction:column";
    var barra = document.createElement("div");
    barra.style.cssText = "display:flex;justify-content:flex-end;padding:6px;background:#0b5a68";
    var x = document.createElement("button");
    x.type = "button";
    x.textContent = "✕ Cerrar";
    x.style.cssText = "border:0;background:transparent;color:#fff;font:600 14px system-ui,sans-serif;cursor:pointer;padding:6px 10px";
    x.onclick = cerrar;
    barra.appendChild(x);
    var marco = document.createElement("iframe");
    marco.src = origen + "/widget";
    marco.title = "AntiEstafa AR: revisá si un mensaje es estafa";
    marco.allow = "clipboard-read; clipboard-write";
    marco.style.cssText = "flex:1;width:100%;border:0";
    panel.appendChild(barra);
    panel.appendChild(marco);
    document.body.appendChild(panel);
    boton.setAttribute("aria-expanded", "true");
    x.focus();
  }

  boton.onclick = abrir;
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") cerrar();
  });

  function montar() {
    document.body.appendChild(boton);
  }
  if (document.body) montar();
  else document.addEventListener("DOMContentLoaded", montar);
})();
