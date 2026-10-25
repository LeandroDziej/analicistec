import { Marked } from "marked";

/** Mismo formato de ancla que GitHub y el PDF: "9. Tus últimos análisis" → "9-tus-ultimos-analisis". */
export function slug(texto: string): string {
  return texto
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-");
}

/**
 * Convierte el manual en Markdown a HTML para mostrarlo dentro de la app.
 * Saca el título principal (la página tiene el suyo), agrega anclas a los
 * títulos para que funcione el índice y abre los links externos en otra pestaña.
 * El contenido es nuestro (docs/MANUAL_DE_USUARIO.md), no lo escribe el usuario.
 */
export function manualAHtml(markdown: string): string {
  const sinTitulo = markdown.replace(/^# [^\n]*\n(?:\r?\n)*/, "");
  const marked = new Marked({
    gfm: true,
    renderer: {
      heading({ tokens, depth, text }) {
        return `<h${depth} id="${slug(text)}">${this.parser.parseInline(tokens)}</h${depth}>\n`;
      },
      link({ href, tokens }) {
        const contenido = this.parser.parseInline(tokens);
        const externo = /^https?:\/\//i.test(href);
        return externo
          ? `<a href="${href}" target="_blank" rel="noopener noreferrer">${contenido}</a>`
          : `<a href="${href}">${contenido}</a>`;
      },
    },
  });
  return marked.parse(sinTitulo, { async: false });
}
