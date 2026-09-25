import { MarkdownPipe } from './markdown.pipe';

describe('MarkdownPipe', () => {
  let pipe: MarkdownPipe;

  beforeEach(() => {
    pipe = new MarkdownPipe();
  });

  describe('entradas vacías', () => {
    it('devuelve cadena vacía para null, undefined y texto vacío', () => {
      expect(pipe.transform(null)).toBe('');
      expect(pipe.transform(undefined)).toBe('');
      expect(pipe.transform('')).toBe('');
    });
  });

  describe('Markdown básico', () => {
    it('convierte encabezados', () => {
      expect(pipe.transform('## Título')).toContain('<h2');
    });

    it('convierte énfasis', () => {
      expect(pipe.transform('esto es **fuerte**')).toContain('<strong>fuerte</strong>');
    });

    it('convierte listas', () => {
      const html = pipe.transform('- uno\n- dos');
      expect(html).toContain('<ul>');
      expect(html).toContain('<li>uno</li>');
    });

    it('convierte tablas', () => {
      const html = pipe.transform('| A | B |\n|---|---|\n| 1 | 2 |');
      expect(html).toContain('<table>');
      expect(html).toContain('<th>A</th>');
    });
  });

  describe('bloques de código', () => {
    // Regresión: sin el lenguaje 'plaintext' registrado, hljs.highlight lanzaba
    // "Unknown language: plaintext", el pipe propagaba la excepción y el artículo
    // ENTERO se renderizaba en blanco, sin ningún error en pantalla.
    it('un bloque SIN lenguaje no rompe el renderizado', () => {
      const html = pipe.transform('```\nsalida de consola\n```');
      expect(html).toContain('<pre>');
      expect(html).toContain('salida de consola');
    });

    it('un lenguaje NO registrado cae en plaintext sin lanzar', () => {
      expect(() => pipe.transform('```rust\nfn main() {}\n```')).not.toThrow();
      expect(pipe.transform('```rust\nfn main() {}\n```')).toContain('fn main()');
    });

    it('un artículo con prosa y bloque sin lenguaje se renderiza completo', () => {
      const html = pipe.transform(
        '# Guía\n\nTexto antes.\n\n```\n¡Hola!\n```\n\nTexto después.'
      );
      expect(html).toContain('Texto antes');
      expect(html).toContain('Texto después');
    });

    it('resalta Java con clases de hljs', () => {
      const html = pipe.transform('```java\npublic class A {}\n```');
      expect(html).toContain('language-java');
      expect(html).toContain('hljs-keyword');
    });

    it('resalta PeopleCode con la gramática propia', () => {
      const html = pipe.transform('```peoplecode\nLocal string &saludo;\n```');
      expect(html).toContain('language-peoplecode');
      expect(html).toContain('hljs-variable');
    });

    it('acepta los alias de PeopleCode', () => {
      expect(pipe.transform('```pcode\nLocal string &x;\n```')).toContain('hljs-variable');
    });
  });

  describe('seguridad', () => {
    // El pipe devuelve string y confía en el sanitizador de [innerHTML] de Angular.
    // Estos tests documentan qué sale del pipe; Angular filtra después.
    it('no ejecuta nada por sí mismo: solo produce texto', () => {
      const html = pipe.transform('Hola <script>alert(1)</script>');
      expect(typeof html).toBe('string');
    });

    it('conserva las clases de resaltado, que el sanitizador respeta', () => {
      expect(pipe.transform('```java\nint x = 1;\n```')).toContain('class="hljs');
    });
  });
});
